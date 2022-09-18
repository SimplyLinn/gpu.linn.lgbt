import traceback
from PIL.Image import Image
from PIL import Image

from .jobParams import UpscaleJobDefinition
from .BaseJob import BaseJob

from super_image import (
  ImageLoader
)
from ProgressReporter import BaseProgressReporter
from super_image.models import *

SCALES = (2, 3, 4)

ACCEPTED_MODELS = {
  "eugenesiow/drln-bam": {
    "title": "Densely Residual Laplacian Super-Resolution (DRLN-BAM)",
    "ranks": (1, 1, 2),
    "model": DrlnModel,
  },
  "eugenesiow/edsr": {
    "title": "Enhanced Deep Residual Networks for Single Image Super-Resolution (EDSR)",
    "ranks": (2, 1, 3),
    "model": EdsrModel,
  },
  "eugenesiow/msrn": {
    "title": "Multi-scale Residual Network for Image Super-Resolution (MSRN)",
    "ranks": (3, 1, 4),
    "model": MsrnModel,
  },
  "eugenesiow/mdsr": {
    "title": "Multi-Scale Deep Super-Resolution System (MDSR)",
    "ranks": (4, 2, 6),
    "model": MdsrModel,
  },
  "eugenesiow/msrn-bam": {
    "title": "Multi-scale Residual Network for Image Super-Resolution (MSRN-BAM)",
    "ranks": (5, 3, 5),
    "model": MsrnModel,
  },
  "eugenesiow/edsr-base": {
    "title": "Enhanced Deep Residual Networks for Single Image Super-Resolution (EDSR-BASE)",
    "ranks": (6, 5, 9),
    "model": EdsrModel,
  },
  "eugenesiow/mdsr-bam": {
    "title": "Multi-Scale Deep Super-Resolution System (MDSR-BAM)",
    "ranks": (7, 4, 7),
    "model": MdsrModel,
  },
  "eugenesiow/awsrn-bam": {
    "title": "Lightweight Image Super-Resolution with Adaptive Weighted Learning Network (AWSRN-BAM)",
    "ranks": (8, 6, 8),
    "model": AwsrnModel,
  },
  "eugenesiow/a2n": {
    "title": "Attention in Attention Network for Image Super-Resolution (A2N)",
    "ranks": (9, 8, 10),
    "model": A2nModel,
  },
  "eugenesiow/carn": {
    "title": "Cascading Residual Network (CARN)",
    "ranks": (10, 7, 11),
    "model": CarnModel,
  },
  "eugenesiow/carn-bam": {
    "title": "Cascading Residual Network (CARN-BAM)",
    "ranks": (11, 9, 12),
    "model": CarnModel,
  },
  "eugenesiow/pan": {
    "title": "Pixel Attention Network (PAN)",
    "ranks": (12, 11, 13),
    "model": PanModel,
  },
  "eugenesiow/pan-bam": {
    "title": "Pixel Attention Network (PAN-BAM)",
    "ranks": (13, 10, 14),
    "model": PanModel,
  },
  "eugenesiow/drln": {
    "title": "Densely Residual Laplacian Super-Resolution (DRLN)",
    "ranks": (None, None, 1),
    "model": DrlnModel,
  },
  "eugenesiow/han": {
    "title": "Holistic Attention Network (HAN)",
    "ranks": (None, None, 1),
    "model": HanModel,
  },
}

class UpscaleJob(BaseJob):
  def __init__(self, sid: str, id: str, progressReporter: BaseProgressReporter, job: UpscaleJobDefinition):
    super().__init__(sid, id, progressReporter)
    if (job['model'] not in ACCEPTED_MODELS):
      raise Exception('Invalid model')
    self.model = job['model']
    self.steps = job['scale'] or 2
    self.image = job['image']

  def run(self):
    try:
      print(self.image);
      image = Image.open('myfile.png')

      model = PanModel.from_pretrained('eugenesiow/pan-bam', scale=2)
      inputs = ImageLoader.load_image(image)
      preds = model(inputs)

      ImageLoader.save_image(preds, 'myfile_x2.png')
    except Exception as e:
      traceback.print_exc()
      self.complete({ 'status': 'error', 'error': str(e) })
