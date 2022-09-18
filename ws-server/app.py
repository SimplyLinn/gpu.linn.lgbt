import traceback
from flask import Flask, request
from flask_socketio import SocketIO, ConnectionRefusedError
from socketio import Server
from tokenProcessor import verify
from worker import Worker

app=Flask(__name__, static_url_path='')
app.config['SECRET_KEY'] = 'secret!'
app.config['HOST_UPDATE_INTERVAL'] = 5
socketio=SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)
backgroundWorker=Worker(app, socketio)

@socketio.on('connect')
def handle_connect(auth):
  global sessions
  if (auth is None):
    raise ConnectionRefusedError('No auth')
  jwtToken = auth.get('jwtToken')
  if (jwtToken is None):
    raise ConnectionRefusedError('No jwtToken in auth')
  try:
    verify(jwtToken)
  except Exception as e:
    raise ConnectionRefusedError('Invalid token: ' + str(e))
  backgroundWorker.registerSid(request.sid)
  print("socket connected")

@socketio.on('disconnect')
def handle_disconnect():
  backgroundWorker.deregisterSid(request.sid)
  print("socket disconnected", request.sid)

def send_packet(server: Server, eio_sid, pkt):
  """Send a Socket.IO packet to a client."""
  if server.manager is None:
    raise RuntimeError('Server not started yet')
  encoded_packet = pkt.encode()
  if isinstance(encoded_packet, list):
      for ep in encoded_packet:
          server.eio.send(eio_sid, ep)
  else:
      server.eio.send(eio_sid, encoded_packet)

@socketio.on('job_request')
def handler(jobDef):
  sid = request.sid
  try:
    (jobId, qpos) = backgroundWorker.enqueueJob(sid, jobDef)
    return {'status': 'enqueued', 'jobId': jobId, 'queuePos': qpos}
  except Exception as e:
    traceback.print_exc()
    return {'status': 'error', 'error': str(e)}

