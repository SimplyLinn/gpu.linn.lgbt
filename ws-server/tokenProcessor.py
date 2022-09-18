from cryptography.x509 import load_pem_x509_certificate
from urllib.request import urlopen
import json
import re
import time
import jwt

url = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

class Cert:
  def __init__(self):
    self.cache = None
    self.expires = 0
  
  def get(self):
    if self.cache is None or self.expires < time.time():
      response = urlopen(url)
      cacheControl = response.headers['cache-control']
      maxAge = None
      if (cacheControl is not None):
        x = re.search("max-age=(\d+)", cacheControl)
        if (x is not None):
          maxAge = int(x.group(1))
      self.cache = json.loads(response.read().decode('utf-8'))
      self.expires = time.time() + maxAge if maxAge is not None else 0
    return self.cache
  
  def publicKey(self, kid):
    rawKey = self.get()[kid]
    if rawKey is None:
      return None
    return load_pem_x509_certificate(rawKey.encode('utf-8')).public_key()

certManager = Cert()

def verify(token):
  headers = jwt.get_unverified_header(token)
  kid = headers.get('kid')
  if (kid is None):
    raise Exception("No kid found")
  publicKey = certManager.publicKey(kid)
  if (publicKey is None):
    raise Exception("No public key found")
  return jwt.decode(token, publicKey, algorithms=['RS256'], audience='stable-diffusion-361908', issuer='https://securetoken.google.com/stable-diffusion-361908')
