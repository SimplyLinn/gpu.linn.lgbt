import type { NextPage } from 'next';
import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from 'src/firebase';

function asString(data: FormDataEntryValue | null): string | null {
  if (typeof data === 'string') {
    return data;
  }
  return null;
}

const errorMap = {
  auth: {
    name: 'Authentication Error',
    messages: {
      'invalid-email': 'Invalid email',
      'user-disabled': 'User disabled',
      'user-not-found': 'User not found',
      'wrong-password': 'Wrong password',
      'network-request-failed': 'Network request failed',
      'quota-exceeded': 'Quota exceeded',
    },
  },
} as const;

function isErrorKey(key: string): key is keyof typeof errorMap {
  return Object.hasOwn(errorMap, key);
}

function isValidCode<ErrorKey extends keyof typeof errorMap>(
  key: ErrorKey,
  code: string,
): code is keyof typeof errorMap[ErrorKey]['messages'] & string {
  return Object.hasOwn(errorMap[key].messages, code);
}

const Login: NextPage = () => {
  const [show, setShow] = useState(false);
  const [error, setError] = useState<
    string | { name: string; message: string } | null
  >(null);
  const [loading, setLoading] = useState(false);
  const toggleShow = useCallback(() => setShow((s) => !s), []);

  const handleSubmit = useCallback((ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const formEl = ev.currentTarget;
    const formData = new FormData(formEl);
    const email = asString(formData.get('email'));
    const password = asString(formData.get('password'));
    const remember = formData.get('remember') === 'on';
    if (!email || !password) {
      setError({
        name: 'Input error',
        message: 'Missing email or password',
      });
      return;
    }
    setError(null);
    setLoading(true);
    setPersistence(
      auth,
      remember ? browserLocalPersistence : browserSessionPersistence,
    )
      .then(() => signInWithEmailAndPassword(auth, email, password))
      .then(() => {
        formEl.reset();
      })
      .catch((thrown) => {
        console.error(thrown);
        const errorCode = thrown.code;
        if (typeof errorCode === 'string') {
          const [errorName, ...codeArr] = errorCode.split('/');
          const code = codeArr.join('/');
          if (isErrorKey(errorName) && isValidCode(errorName, code)) {
            setError({
              name: errorMap[errorName].name,
              message: errorMap[errorName].messages[code],
            });
            return;
          }
        }
        setError(thrown);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="container max-w-full mx-auto py-24 px-6">
      <div className="font-sans">
        <div className="max-w-sm mx-auto px-6">
          <div className="relative flex flex-wrap">
            <div className="w-full relative">
              <div className="mt-6">
                <div className="text-center font-semibold mb-4">
                  Linn&apos;s GPU Toybox
                </div>

                {error && (
                  <div
                    className="flex bg-red-100 rounded-lg p-4 mb-4 text-sm text-red-700"
                    role="alert"
                  >
                    <svg
                      className="w-5 h-5 inline mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <div>
                      {typeof error === 'string' ? (
                        error
                      ) : (
                        <>
                          <span className="font-medium">{error.name}</span>{' '}
                          {error.message}
                        </>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="mx-auto max-w-lg">
                    <div className="py-2">
                      <span className="px-1 text-sm text-gray-600">Email</span>
                      <input
                        placeholder=""
                        name="email"
                        disabled={loading}
                        type="email"
                        required
                        autoComplete="email"
                        className="text-md block px-3 py-2 text-black rounded-lg w-full bg-white border-2 border-gray-300 placeholder-gray-600 shadow-md focus:placeholder-gray-500 focus:bg-white focus:border-gray-600 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div className="py-2">
                      <span className="px-1 text-sm text-gray-600">
                        Password
                      </span>
                      <div className="relative">
                        <input
                          placeholder=""
                          name="password"
                          autoComplete="current-password"
                          disabled={loading}
                          type={show ? 'text' : 'password'}
                          required
                          className="text-md block px-3 py-2 text-black rounded-lg w-full bg-white border-2 border-gray-300 placeholder-gray-600 shadow-md focus:placeholder-gray-500 focus:bg-white focus:border-gray-600 focus:outline-none disabled:opacity-50"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                          <svg
                            className={classNames(
                              'h-6 text-gray-700',
                              !show && 'hidden',
                              show && 'block',
                              loading && 'opacity-50',
                            )}
                            fill="none"
                            onClick={loading ? undefined : toggleShow}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="-32 0 640 512"
                          >
                            <path
                              fill="currentColor"
                              d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"
                            ></path>
                          </svg>

                          <svg
                            className={classNames(
                              'h-6 text-gray-700',
                              show && 'hidden',
                              !show && 'block',
                              loading && 'opacity-50',
                            )}
                            fill="none"
                            onClick={loading ? undefined : toggleShow}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 640 512"
                          >
                            <path
                              fill="currentColor"
                              d="M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z"
                            ></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <label
                        className={classNames(
                          'block font-bold my-4',
                          loading && 'opacity-50',
                        )}
                      >
                        <input
                          type="checkbox"
                          disabled={loading}
                          className="leading-loose text-pink-600"
                          name="remember"
                        />{' '}
                        <span className="py-2 text-sm leading-snug">
                          Remember Me
                        </span>
                      </label>
                      <button
                        disabled={loading}
                        type="button"
                        className="block font-bold my-4 tracking-tighter border-b-2 border-gray-400 hover:border-gray-200 disabled:opacity-50 disabled:border-gray-400"
                      >
                        <span>Forgot Password?</span>
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-3 text-lg font-semibold bg-gray-800 w-full text-white rounded-lg px-6 py-3 block shadow-xl hover:bg-black disabled:opacity-50 disabled:bg-gray-800"
                    >
                      Login
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Object.assign(Login, {
  useLayout: false,
});
