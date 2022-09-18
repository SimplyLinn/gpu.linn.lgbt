import traceback
from flask import Flask
from flask_socketio import SocketIO
from typing import Any, Literal, Union
from collections import deque
from queue import Queue

from job import JobDefinition, make_job, BaseJob

class Worker:
    def __init__(self, app: Flask, socketio: SocketIO):
      self.app = app
      self.socketio = socketio
      self.queue = Queue()
      self.sessions: 'set[str]' = set()
      self.stopping = False
      self.thread = socketio.start_background_task(target=self, app=app)

    def updateQueue(self):
      q: 'deque[Union[JobDefinition, Literal["stop"]]]' = self.queue.queue.copy()
      for i, job in enumerate(q):
        if (job == 'stop'):
          break
        sid = job['sid']
        if (sid in self.sessions):
          self.socketio.emit('job_progress', { 'jobId': job['jobId'], 'queuePos': i + 1 }, to=job['sid'])

    def __call__(self, app: Flask):
        with app.app_context():
            while True:
              job: Union[BaseJob, Literal['stop']] = self.queue.get()
              if job == 'stop' or self.stopping:
                self.queue.task_done()
                break
              if (job.sid not in self.sessions):
                self.queue.task_done()
                continue
              self.updateQueue()
              try:
                job.run()
              except Exception:
                traceback.print_exc()
              self.queue.task_done()

    def enqueueJob(self, sid: str, jobDef: JobDefinition):
      job = make_job(self.socketio, sid, jobDef)
      qsize = self.queue.qsize()
      self.queue.put(job)
      return (job.id, qsize + 1)

    def registerSid(self, sid: str):
      self.sessions.add(sid)

    def deregisterSid(self, sid: str):
      self.sessions.discard(sid)

    def stop(self):
      self.stopping = True
      self.queue.put('stop')
      self.thread.join()