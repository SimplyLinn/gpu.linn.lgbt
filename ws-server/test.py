from super_image import (
  ImageLoader
)
from super_image.models import PanModel
from PIL import Image

image = Image.open('myfile.png')

model = PanModel.from_pretrained('eugenesiow/pan-bam', scale=2)
inputs = ImageLoader.load_image(image)
preds = model(inputs)

ImageLoader.save_image(preds, 'myfile_x2.png')
