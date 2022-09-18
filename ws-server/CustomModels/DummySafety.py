from transformers import FeatureExtractionMixin

class DummyTensor():
  def __init__(self):
    self.pixel_values = None

  def to(self, *_, **__):
    return self

class DummyFeatureExtractor(FeatureExtractionMixin):
  def __init__(self, **kwargs):
    pass

  @classmethod
  def from_pretrained(
      cls, *_, **__
  ):
    return cls.from_dict()

  @classmethod
  def from_dict(cls, *_, **__):
    return cls()

  @classmethod
  def from_json_file(cls, *_, **__):
    return cls()

  def __call__(
      self,
      *_,
      **__
  ):
    return DummyTensor()

def DummySafetyChecker(images, *_, **__):
  has_nsfw_concepts = [False for _ in images]
  return images, has_nsfw_concepts
