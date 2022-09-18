
from typing import Literal, TypedDict, Union
from uuid import uuid4
from flask_socketio import SocketIO

from .jobParams import JobDefinition
from .BaseJob import BaseJob
from .Txt2ImgJob import Txt2ImgJob
from .UpscaleJob import UpscaleJob
from ProgressReporter.SingleJobProgressReporter import ProgressReporter

def make_job(socketio: SocketIO, sid: str, jobDef: JobDefinition) -> BaseJob:
    id = str(uuid4())
    if (jobDef['type'] == 'txt2img'):
        return Txt2ImgJob(sid, id, ProgressReporter(socketio, sid, id), jobDef)
    elif (jobDef['type'] == 'upscale'):
        return UpscaleJob(sid, id, ProgressReporter(socketio, sid, id), jobDef)
    else:
        raise Exception('Invalid job type')