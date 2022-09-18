import numpy as np
import cv2
from PIL import Image

import torch
from torch import Tensor


class ImageLoader:
    @staticmethod
    def load_image(image: Image):
        lr = np.array(image.convert('RGB'))
        lr = lr[::].astype(np.float32).transpose([2, 0, 1]) / 255.0
        return torch.as_tensor(np.array([lr]))

    @staticmethod
    def _process_image_to_save(pred: Tensor):
        arr = pred.data.cpu().numpy()[0]
        arr = arr.transpose((1, 2, 0)) * 255.0
        return pred

    @staticmethod
    def save_image(pred: Tensor, output_file: str):
        pred = ImageLoader._process_image_to_save(pred)
        cv2.imwrite(output_file, pred)

    @staticmethod
    def get_image(pred: Tensor):
        pred = ImageLoader._process_image_to_save(pred)
        return Image.fromarray(pred)

