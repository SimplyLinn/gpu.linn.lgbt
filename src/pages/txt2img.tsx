import classNames from 'classnames';
import type { NextPage } from 'next';
import { useCallback, useEffect, useState } from 'react';
import { useSocket } from 'src/contexts/socketContext';

function ProgressBar({ progress }: { progress: number | null }) {
  return (
    <div className="w-full h-2 bg-gray-300 relative">
      <div
        className={classNames(
          'h-full bg-green-500 absolute',
          progress == null && 'animate-ping-pong-horizontal',
        )}
        style={{
          width: `${progress ?? 10}%`,
        }}
      />
    </div>
  );
}

type ProgressUpdate =
  | {
      step: number;
      totalSteps: number | null;
      progress: number | null;
      jobId: string;
      stepDescription: string | null;
    }
  | { jobId: string; queuePos: number };

function Progress({ status }: { status: ProgressUpdate | null }) {
  if (status == null) return <div>Idle</div>;
  if (!('step' in status)) {
    return (
      <div>
        Job {status.jobId} is number {status.queuePos} in line.
      </div>
    );
  }
  return (
    <div>
      <div>
        Running step {status.step}
        {status.totalSteps != null && ` of ${status.totalSteps}`}...
      </div>
      <ProgressBar progress={status.progress} />
      {status.stepDescription != null && <div>{status.stepDescription}</div>}
    </div>
  );
}

type JobRequestResponse =
  | {
      status: 'enqueued';
      jobId: string;
      queuePos: number;
    }
  | {
      status: 'error';
      error: string;
    };

type JobRequest = {
  type: string;
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  nsfw?: boolean;
};

const Home: NextPage = () => {
  const [result, setResult] = useState<
    | { status: 'success'; data: Blob }
    | { status: 'error'; error: string }
    | null
  >(null);
  const [url, setUrl] = useState<string | null>();
  const [progressStatus, setProgressStatus] = useState<ProgressUpdate | null>(
    null,
  );
  const socket = useSocket();
  const cb = useCallback(
    (ev: React.FormEvent<HTMLFormElement>) => {
      ev.preventDefault();
      if (!socket) {
        setResult({ status: 'error', error: 'No socket connection' });
        return;
      }
      const formData = new FormData(ev.currentTarget);
      const prompt = formData.get('prompt');
      if (typeof prompt !== 'string') {
        setResult({ status: 'error', error: 'Prompt must be a string' });
        return;
      }
      setResult(null);
      const request: JobRequest = {
        type: 'txt2img',
        prompt,
        width: 128,
        height: 128,
        steps: 25,
        nsfw: true,
        model: 'hakurei/waifu-diffusion',
      };
      socket.emit('job_request', request, (e: JobRequestResponse) => {
        if (e.status === 'error') {
          setResult({ status: 'error', error: e.error });
          return;
        }
        setProgressStatus({ jobId: e.jobId, queuePos: e.queuePos });
      });
    },
    [socket],
  );

  useEffect(() => {
    if (!socket) return;
    const onJobComplete = (
      res:
        | {
            status: 'success';
            type: string;
            jobId: string;
          }
        | {
            status: 'error';
            jobId: string;
          },
      data: Record<string, any>,
    ) => {
      setProgressStatus((old) => {
        if (old?.jobId !== res.jobId) return old;
        if (res.status === 'success') {
          setResult({
            status: 'success',
            data: new Blob([data.data], { type: data.type }),
          });
        } else {
          setResult({
            status: 'error',
            error: data.error,
          });
        }
        return null;
      });
    };
    const onProgress = (args: ProgressUpdate) => {
      setProgressStatus((old) => {
        if (old?.jobId !== args.jobId) return old;
        return { ...args };
      });
    };
    socket.on('job_complete', onJobComplete);
    socket.on('job_progress', onProgress);
    return () => {
      socket.off('job_complete', onJobComplete);
      socket.off('job_progress', onProgress);
    };
  }, [socket]);

  useEffect(() => {
    if (!result || result.status !== 'success') setUrl(null);
    else setUrl(URL.createObjectURL(result.data));
  }, [result]);

  return (
    <div className="p-8">
      <form onSubmit={cb}>
        <input
          type="text"
          name="prompt"
          className="text-black"
          autoComplete="off"
        />
        <input type="submit" value="start" />
      </form>
      {!url && <Progress status={progressStatus} />}
      {result?.status === 'error' && (
        <div className="bg-red-500 text-white p-4">{result.error}</div>
      )}
      {url && <img src={url} />}
    </div>
  );
};

export default Home;
