
"""
Utilities for working with the local cache and the HuggingFace hub.
Functions are adapted from the HuggingFace transformers library at
https://github.com/huggingface/transformers/.
"""
from urllib.parse import urlparse

WEIGHTS_NAME = 'pytorch_model.pt'
WEIGHTS_NAME_SCALE = 'pytorch_model_{scale}x.pt'
CONFIG_NAME = 'config.json'


def is_remote_url(url_or_filename):
    parsed = urlparse(url_or_filename)
    return parsed.scheme in ("http", "https")

