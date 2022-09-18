import io
from typing import Any, Optional, Union
from flask_socketio import SocketIO
from . import BaseProgressReporter, completeStatus

class JobChainProgressReporterInstance(BaseProgressReporter):
  def __init__(self, parent: "JobChainProgressReporter", *, title: Optional[str], totalSteps: Optional[int]):
    super().__init__()
    self.step = 0
    self.totalSteps = totalSteps
    self.stepDescription = None
    self.title = title
    self.parent = parent

  def sendProgress(self, progress: Optional[Union[float, bool]]):
    if (progress == True):
      progress = 0.0
    elif (progress == False):
      progress = None
    self.parent.sendProgress(
      self,
      progress = progress,
      step = self.step,
      totalSteps = self.totalSteps,
      stepDescription = self.stepDescription
    )
  
  def complete(self, status: completeStatus, **kwargs):
    self.parent.complete(self, status, **kwargs)

class JobChainProgressReporter:
  def __init__(self, socketio: SocketIO, sid: str, jobId: str, chainLength: Optional[int] = None):
    super().__init__()
    self.socketio = socketio
    self.sid = sid
    self.jobId = jobId
    self.chainLength = chainLength
    self._jobs: list[JobChainProgressReporterInstance] = []
    self.jobIndex = -1
    self.socketio.emit('job_progress', {'jobId': self.jobId, 'progress': None, 'step': 0, 'totalSteps': None, 'stepDescription': 'Initializing' }, to=self.sid)
    self.lastCompletedData: dict[str, Any] = None
    self.finalized = False

  def _get_job_index(self, job):
    for i in range(len(self._jobs)):
      if self._jobs[i] == job:
        return i
    return -1

  def _set_new_job_index(self, index: int):
    if self.lastCompletedData is not None:
      if not self.finalized:
        self.socketio.emit(
        'job_partial',
        {
          'jobId': self.jobId,
          'subJob': self.jobIndex,
          'title': self._jobs[self.jobIndex].title
        },
        self.lastCompletedData,
        to=self.sid
      )
      self.lastCompletedData = None
    self.jobIndex = index


  def complete(self, instance: JobChainProgressReporterInstance, status: completeStatus, **kwargs):
    if self.finalized:
      return
    jobIndex = self._get_job_index(instance)
    if jobIndex == -1:
      return
    if jobIndex < self.jobIndex:
      return    
    elif jobIndex > self.jobIndex:
      self._set_new_job_index(jobIndex)

    if status != 'success':
      self.finalized = True
      self.socketio.emit(
        'job_complete',
        {
          'status': status,
          'jobId': self.jobId,
        },
        kwargs,
        to=self.sid
      )

    self.lastCompletedData = kwargs

    
  def finalize(self):
    if self.finalized:
      return
    if self.lastCompletedData is not None:
      self.socketio.emit(
        'job_complete',
        {
          'status': 'success',
          'jobId': self.jobId,
        },
        self.lastCompletedData,
        to=self.sid
      )
    else:
      self.socketio.emit(
        'job_complete',
        {
          'status': 'error',
          'jobId': self.jobId,
        },
        {
          'error': 'No data was sent from any subjobs'
        },
        to=self.sid
      )

  def sendProgress(self, instance: JobChainProgressReporterInstance, progress: Optional[float], step: int, totalSteps: Optional[int] = None, stepDescription: Optional[str] = None):
    if self.finalized:
      return
    jobIndex = self._get_job_index(instance)
    if jobIndex == -1:
      return
    if jobIndex < self.jobIndex:
      return
    elif jobIndex > self.jobIndex:
      self._set_new_job_index(jobIndex)
    
    if self.chainLength is not None:
      jobDescription = f"Subjob {jobIndex + 1}/{self.chainLength}"
    else:
      jobDescription = f"Subjob {jobIndex + 1}"
    
    if instance.title is not None:
      jobDescription += f" ({instance.title})"

    if stepDescription is None:
      jobDescription += f": {stepDescription}"

    self.socketio.emit('job_progress', {'jobId': self.jobId, 'progress': progress, 'step': step, 'totalSteps': totalSteps, 'stepDescription': jobDescription }, to=self.sid)

  def getProgressReporterInstance(self, *, title: Optional[str] = None, totalSteps: Optional[int] = None):
    instance = JobChainProgressReporterInstance(
      self,
      title = title,
      totalSteps = totalSteps
    )
    index = len(self._jobs)
    self._jobs.append(instance)
    if self.chainLength is not None and index + 1 > self.chainLength:
      self.chainLength = None
    return instance
