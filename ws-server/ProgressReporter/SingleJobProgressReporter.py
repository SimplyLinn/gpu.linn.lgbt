from typing import Any, Optional, Union
from flask_socketio import SocketIO
from . import BaseProgressReporter, completeStatus

class ProgressReporter(BaseProgressReporter):
  def __init__(self, socketio: SocketIO, sid: str, jobId: str, totalSteps: Optional[int] = None):
    super().__init__(totalSteps)
    self.socketio = socketio
    self.sid = sid
    self.jobId = jobId
    self.socketio.emit('job_progress', {'jobId': self.jobId, 'progress': None, 'step': 0, 'totalSteps': self.totalSteps, 'stepDescription': 'Initializing' }, to=self.sid)

  def sendProgress(self, progress: Optional[Union[float, bool]]):
    if (progress == True and type(progress) == bool):
      progress = 0.0
    elif (progress == False and type(progress) == bool):
      progress = None
    self.socketio.emit('job_progress', {'jobId': self.jobId, 'progress': progress, 'step': self.step, 'totalSteps': self.totalSteps, 'stepDescription': self.stepDescription }, to=self.sid)

  def complete(self, status: completeStatus, **kwargs):
    self.socketio.emit(
      'job_complete',
      (
        {
          "status": status,
          "jobId": self.jobId,
        },
        kwargs
      ),
      to=self.sid
    )
