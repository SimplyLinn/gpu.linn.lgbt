from abc import ABC, abstractmethod
from ProgressReporter import BaseProgressReporter, completeStatus

class BaseJob(ABC):
  def __init__(self, sid: str, id: str, progressReporter: BaseProgressReporter):
    self.id = id
    self.progressReporter = progressReporter
    self.sid = sid

  @abstractmethod
  def run(self):
    self.complete({ 'status': 'error', 'error': 'Run method meant to be implemented by subclass' })

  def complete(self, status: completeStatus = 'success', **kwargs):
    self.progressReporter.complete(status, **kwargs)
