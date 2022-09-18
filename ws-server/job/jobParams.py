from typing import Any, Literal, Optional, TypeVar, TypedDict, Union

T = TypeVar("T", bound=str)

class BaseDefinition(TypedDict):
  type: str

class Txt2ImgDefinition(BaseDefinition):
  type: Literal["txt2img"]
  prompt: str
  model: Optional[str]
  steps: Optional[int]
  width: Optional[int]
  height: Optional[int]

class UpscaleJobDefinition(BaseDefinition):
  type: Literal["upscale"]
  scale: Literal[2, 3, 4]
  model: str
  image: Any

class ChainJobDefinition(BaseDefinition):
  type: Literal["chain"]
  jobs: "list[Any]"


JobDefinition = Union[
  Txt2ImgDefinition,
  UpscaleJobDefinition,
  ChainJobDefinition
]
