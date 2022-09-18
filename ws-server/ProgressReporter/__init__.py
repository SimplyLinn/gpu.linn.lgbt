from abc import ABC, abstractmethod
import io
from typing import Any, Literal, Optional, Union
from diffusers import DiffusionPipeline

completeStatus = Literal['success', 'error']

class BaseProgressReporter(ABC):

  def __init__(self, totalSteps: Optional[int] = None):
    super().__init__()
    self.step = 0
    self.totalSteps = totalSteps
    self.stepDescription = None

  @abstractmethod
  def sendProgress(self, progress: Optional[Union[float, bool]]):
    pass

  @abstractmethod
  def complete(self, status: completeStatus, **kwargs):
    pass

  def setStep(self, step: int, description: Optional[str] = None, progress: Optional[Union[float, bool]] = None):
    if (self.totalSteps is not None and step > self.totalSteps):
      self.totalSteps = None
    self.step = step
    self.stepDescription = description
    self.sendProgress(progress)
  
  def nextStep(self, description: Optional[str] = None, progress: Optional[Union[float, bool]] = None):
    self.setStep(self.step + 1, description, progress)

  def attachToDiffusionPipeline(self, target: DiffusionPipeline):
    file = DiffusionPipelineFile(self)
    target.set_progress_bar_config(file=file, bar_format="{percentage}", write_bytes=True, disable=False)


class DiffusionPipelineFile:
  def __init__(self, parent: BaseProgressReporter):
    self.buffer = io.BytesIO()
    self.parent = parent

  def write(self, msg: bytes):
    self.buffer.write(msg)

  def flush(self):
    val = self.buffer.getvalue()
    self.buffer.seek(0)
    self.buffer.truncate(0)
    try:
      self.parent.sendProgress(float(val))
    except:
      pass
