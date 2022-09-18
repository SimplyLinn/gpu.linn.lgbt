from app import app, socketio, backgroundWorker

if __name__=='__main__':
  socketio.run(app)
  backgroundWorker.stop()
