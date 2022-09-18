""" Modelling base class and utilities."""

import math
import os
import logging
from typing import Optional, Union, Callable

import torch
import torch.nn as nn

from huggingface_hub import hf_hub_download

from .configuration_utils import PretrainedConfig
from .data.datasets import (
    DIV2K_RGB_MEAN,
    DIV2K_RGB_STD
)
from .file_utils import (
    WEIGHTS_NAME,
    WEIGHTS_NAME_SCALE,
    is_remote_url,
)

logger = logging.getLogger(__name__)


def make_layer(block, n_layers):
    layers = []
    for _ in range(n_layers):
        layers.append(block())
    return nn.Sequential(*layers)


def default_conv(in_channels, out_channels, kernel_size, bias=True):
    return nn.Conv2d(
        in_channels, out_channels, kernel_size,
        padding=(kernel_size // 2), bias=bias)


class MeanShift(nn.Conv2d):
    def __init__(self, rgb_range, rgb_mean=DIV2K_RGB_MEAN, rgb_std=DIV2K_RGB_STD, sign=-1):
        super(MeanShift, self).__init__(3, 3, kernel_size=1)
        std = torch.Tensor(rgb_std)
        self.weight.data = torch.eye(3).view(3, 3, 1, 1)
        self.weight.data.div_(std.view(3, 1, 1, 1))
        self.bias.data = sign * rgb_range * torch.Tensor(rgb_mean)
        self.bias.data.div_(std)
        self.requires_grad = False


class BasicBlock(nn.Sequential):
    def __init__(
            self, in_channels, out_channels, kernel_size, stride=1, bias=False,
            bn=True, act=nn.ReLU(True)):

        m = [nn.Conv2d(
            in_channels, out_channels, kernel_size,
            padding=(kernel_size // 2), stride=stride, bias=bias)
        ]
        if bn:
            m.append(nn.BatchNorm2d(out_channels))
        if act is not None:
            m.append(act)
        super(BasicBlock, self).__init__(*m)


class Upsampler(nn.Sequential):
    def __init__(self, conv, scale, n_feats, bn=False, act=False, bias=True):

        m = []
        if (scale & (scale - 1)) == 0:  # Is scale = 2^n?
            for _ in range(int(math.log(scale, 2))):
                m.append(conv(n_feats, 4 * n_feats, 3, bias))
                m.append(nn.PixelShuffle(2))
                if bn:
                    m.append(nn.BatchNorm2d(n_feats))

                if act == 'relu':
                    m.append(nn.ReLU(True))
                elif act == 'prelu':
                    m.append(nn.PReLU(n_feats))

        elif scale == 3:
            m.append(conv(n_feats, 9 * n_feats, 3, bias))
            m.append(nn.PixelShuffle(3))
            if bn:
                m.append(nn.BatchNorm2d(n_feats))

            if act == 'relu':
                m.append(nn.ReLU(True))
            elif act == 'prelu':
                m.append(nn.PReLU(n_feats))
        else:
            raise NotImplementedError

        super(Upsampler, self).__init__(*m)


class PixelAttentionBlock(nn.Module):
    def __init__(self, nf):
        super(PixelAttentionBlock, self).__init__()
        self.conv = nn.Conv2d(nf, nf, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        y = self.conv(x)
        y = self.sigmoid(y)
        out = torch.mul(x, y)

        return out


class ChannelAttention(nn.Module):
    def __init__(self, in_planes, ratio=16):
        super(ChannelAttention, self).__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)

        self.fc1 = nn.Conv2d(in_planes, in_planes // ratio, 1, bias=False)
        self.relu1 = nn.PReLU(in_planes // ratio)
        self.fc2 = nn.Conv2d(in_planes // ratio, in_planes, 1, bias=False)

        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out = self.fc2(self.relu1(self.fc1(self.avg_pool(x))))
        out = avg_out
        return self.sigmoid(out)


class SpatialAttention(nn.Module):
    def __init__(self, kernel_size=7):
        super(SpatialAttention, self).__init__()

        assert kernel_size in (3, 7), 'kernel size must be 3 or 7'
        padding = 3 if kernel_size == 7 else 1

        self.conv1 = nn.Conv2d(1, 1, kernel_size, padding=padding, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        x = self.conv1(max_out)
        return self.sigmoid(x)


class BamBlock(nn.Module):
    def __init__(self, in_planes, reduction=16):
        super(BamBlock, self).__init__()

        self.ca = ChannelAttention(in_planes, reduction)
        self.sa = SpatialAttention()

    def forward(self, x):
        ca_ch = self.ca(x)
        sa_ch = self.sa(x)
        out = ca_ch.mul(sa_ch) * x
        return out


class PreTrainedModel(nn.Module):
    def __init__(self, config: PretrainedConfig, *inputs, **kwargs):
        super().__init__()
        if not isinstance(config, PretrainedConfig):
            raise ValueError(
                f"Parameter config in `{self.__class__.__name__}(config)` should be an instance of class "
                "`PretrainedConfig`. To create a model from a pretrained model use "
                f"`model = {self.__class__.__name__}.from_pretrained(PRETRAINED_MODEL_NAME)`"
            )
        # Save config and origin of the pretrained weights if given in model
        self.config = config
        self.name_or_path = config.name_or_path

    @classmethod
    def from_pretrained(cls, pretrained_model_name_or_path: Optional[Union[str, os.PathLike]], *model_args, **kwargs):
        scale = kwargs.get("scale", None)
        config = kwargs.pop("config", None)
        state_dict = kwargs.pop("state_dict", None)
        cache_dir = kwargs.pop("cache_dir", None)

        # Load config if we don't provide a configuration
        if not isinstance(config, PretrainedConfig):
            config_path = config if config is not None else pretrained_model_name_or_path
            config, model_kwargs = cls.config_class.from_pretrained(
                config_path,
                *model_args,
                cache_dir=cache_dir,
                **kwargs,
            )
        else:
            model_kwargs = kwargs

        # Setup scale
        if scale is not None:
            weights_name = WEIGHTS_NAME_SCALE.format(scale=scale)
        else:
            weights_name = WEIGHTS_NAME

        # Load model
        if pretrained_model_name_or_path is not None:
            pretrained_model_name_or_path = str(pretrained_model_name_or_path)
            if os.path.isdir(pretrained_model_name_or_path):
                if os.path.isfile(os.path.join(pretrained_model_name_or_path, weights_name)):
                    # Load from a PyTorch checkpoint
                    archive_file = os.path.join(pretrained_model_name_or_path, weights_name)
                else:
                    raise EnvironmentError(
                        f"Error no file named {weights_name} found in "
                        f"directory {pretrained_model_name_or_path}."
                    )
            elif os.path.isfile(pretrained_model_name_or_path) or is_remote_url(pretrained_model_name_or_path):
                archive_file = pretrained_model_name_or_path
            else:
                # set correct filename
                filename = weights_name

                archive_file = hf_hub_download(
                    pretrained_model_name_or_path,
                    filename=filename
                )
            
            logger.info(f"loading weights file {archive_file}")
        else:
           archive_file = None

        if state_dict is None:
            try:
                state_dict = torch.load(archive_file, map_location="cpu")
            except Exception:
                raise OSError(
                    f"Unable to load weights from pytorch checkpoint file for '{pretrained_model_name_or_path}' "
                    f"at '{archive_file}'"
                )

        config.name_or_path = pretrained_model_name_or_path

        model = cls(config, *model_args, **model_kwargs)
        if config.data_parallel and not isinstance(model, nn.DataParallel):
            model = nn.DataParallel(model)
        model.load_state_dict(state_dict)

        # Set model in evaluation mode to deactivate DropOut modules by default
        model.eval()

        return model
