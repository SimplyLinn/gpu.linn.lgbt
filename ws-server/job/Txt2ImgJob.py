import io
import traceback
from torch import autocast, float32, float16, cuda
from diffusers import StableDiffusionPipeline, DiffusionPipeline
from PIL.Image import Image
from CustomModels.DummySafety import DummySafetyChecker, DummyFeatureExtractor

from .jobParams import Txt2ImgDefinition
from .utils import loadModel
from .BaseJob import BaseJob
from ProgressReporter import BaseProgressReporter


ACCEPTED_MODELS = {
  "CompVis/stable-diffusion-v1-1": 'Stable Diffusion v1.1',
  "CompVis/stable-diffusion-v1-2": 'Stable Diffusion v1.2',
  "CompVis/stable-diffusion-v1-3": 'Stable Diffusion v1.3',
  "CompVis/stable-diffusion-v1-4": 'Stable Diffusion v1.4',
  "hakurei/waifu-diffusion": 'Waifu Diffusion',
}

device = 'cuda' if cuda.is_available() and cuda.current_device() else 'cpu'

def runModel(pipe: DiffusionPipeline, *args, **kwargs):
  pipe = pipe.to(device)
  if (device == 'cuda'):
    with autocast(device):
      return pipe(*args, **kwargs)
  else:
    return pipe(*args, **kwargs)

class Txt2ImgJob(BaseJob):
  def __init__(self, sid: str, id: str, progressReporter: BaseProgressReporter, job: Txt2ImgDefinition):
    super().__init__(sid, id, progressReporter)
    model = job.get('model') or 'CompVis/stable-diffusion-v1-4'
    if (model not in ACCEPTED_MODELS):
      raise Exception('Invalid model')
    self.prompt = job['prompt']
    self.model = model
    self.steps = job.get('steps') or 50
    self.width = job.get('width') or 512
    self.height = job.get('height') or 512
    self.nsfw = job.get('nsfw') or False

  def run(self):
    extraArgs = {}
    if self.nsfw:
      extraArgs['safety_checker']=DummySafetyChecker
      extraArgs['feature_extractor']=DummyFeatureExtractor()
    try:
      pipe = loadModel(
        StableDiffusionPipeline,
        self.model,
        self.progressReporter,
        use_auth_token=True,
        torch_dtype=float16 if device == 'cuda' else float32,
        **extraArgs,
      )
      self.progressReporter.nextStep('Generating Image', True)
      result = runModel(pipe, self.prompt, width = self.width, height = self.height, num_inference_steps = self.steps)
      image: Image = result.images[0]
      nsfw: bool = result.nsfw_content_detected[0]
      img_data = io.BytesIO()
      image.save(img_data, "PNG")
      self.complete('success',
        data = img_data.getvalue(),
        type = 'image/png',
        nsfw = nsfw,
      )
    except Exception as e:
      traceback.print_exc()
      self.complete('error', error = str(e))
