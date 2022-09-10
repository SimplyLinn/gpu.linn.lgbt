// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import Paperspace, { MachineInfo } from 'paperspace-node';
import { https } from 'firebase-functions';
import { promisify } from 'util';
import { app } from 'src/server/firebase';

const apiKey = process.env.PAPERSPACE_API_KEY;
const workerMachineId = process.env.PAPERSPACE_WORKER_MACHINE_ID;

const paperspace = Paperspace({
  apiKey,
});

const machineInfo = promisify(paperspace.machines.show);
const machineUtilization = promisify(paperspace.machines.utilization);

export type Data = {
  id: string;
  name: string;
  ram: string | null;
  cpus: number;
  gpu: string | null;
  state: MachineInfo['state'];
  region: string | null;
  costs: {
    previousMonth: {
      utilizationCost: number;
      storageUtilizationCost: number;
      totalCost: number;
      billingMonth: string;
      currency: string;
    };
    currentMonth: {
      utilizationCost: number;
      storageUtilizationCost: number;
      totalCost: number;
      billingMonth: string;
      currency: string;
    };
  };
};

interface CallableContext extends Omit<https.CallableContext, 'rawRequest'> {
  rawRequest: NextApiRequest;
}

type HttpErrorWireFormat = ReturnType<https.HttpsError['toJSON']>;

function firebaseFunction<Input, Output>(
  handler: (data: Input, context: CallableContext) => Promise<Output>,
): (
  req: NextApiRequest,
  res: NextApiResponse<{ data: Output } | HttpErrorWireFormat>,
) => Promise<void> {
  return async (req, res) => {
    try {
      if (req.method !== 'POST') {
        res.status(405).end();
        return;
      }
      const authHeader = req.headers.authorization?.match(/^Bearer (.*)$/)?.[1];
      const token = authHeader
        ? await app.auth().verifyIdToken(authHeader)
        : null;
      const auth = token ? { uid: token.uid, token } : undefined;
      const context: CallableContext = {
        rawRequest: req,
        auth,
      };
      const data = await handler(req.body, context);
      res.status(200).json({
        data,
      });
    } catch (error) {
      if (error instanceof https.HttpsError) {
        const status = error.httpErrorCode.status;
        res.status(status).json(error.toJSON());
        return;
      }
      console.error(error);
      let err;
      if (error instanceof Error) {
        err = new https.HttpsError('unknown', error.message);
      } else if (typeof error === 'string') {
        err = new https.HttpsError('unknown', error);
      } else {
        err = new https.HttpsError('unknown', 'Unknown error');
      }
      res.status(500).json(err.toJSON());
    }
  };
}

async function getCostForMonth(machineId: string, month?: string | Date) {
  if (month == null || typeof month === 'object') {
    const now = typeof month === 'object' ? month : new Date();
    month = `${now.getUTCFullYear()}-${(now.getUTCMonth() + 1)
      .toFixed(0)
      .padStart(2, '0')}`;
  }
  const { storageUtilization, utilization } = await machineUtilization({
    machineId,
    billingMonth: month,
  });
  let utilizationCost = 0;
  let storageUtilizationCost = 0;
  if ('hourlyRate' in utilization) {
    utilizationCost =
      (utilization.secondsUsed * Number(utilization.hourlyRate)) / 3600;
  } else {
    utilizationCost = Number(utilization.monthlyRate);
  }
  if ('hourlyRate' in storageUtilization) {
    storageUtilizationCost =
      (storageUtilization.secondsUsed * Number(storageUtilization.hourlyRate)) /
      3600;
  } else {
    storageUtilizationCost = Number(storageUtilization.monthlyRate);
  }
  let billingMonth = month;
  if (storageUtilization.billingMonth === utilization.billingMonth) {
    billingMonth = storageUtilization.billingMonth;
  }
  return {
    utilizationCost,
    storageUtilizationCost,
    totalCost: utilizationCost + storageUtilizationCost,
    billingMonth,
    currency: 'USD',
  };
}

export default firebaseFunction(async (data, context) => {
  const { auth } = context;
  if (!auth) {
    throw new https.HttpsError('unauthenticated', 'Unauthenticated');
  }
  if (workerMachineId == null) {
    throw new https.HttpsError(
      'internal',
      'PAPERSPACE_WORKER_MACHINE_ID is not set',
    );
  }
  const prevMonth = new Date();
  prevMonth.setUTCMonth(prevMonth.getUTCMonth() - 1);
  const costPreviousMonth = await getCostForMonth(workerMachineId, prevMonth);
  const costsCurrentMonth = await getCostForMonth(workerMachineId);
  const { id, name, ram, state, region, cpus, gpu } = await machineInfo({
    machineId: workerMachineId,
  });
  return {
    id,
    name,
    ram,
    cpus,
    gpu,
    state,
    region,
    costs: {
      previousMonth: costPreviousMonth,
      currentMonth: costsCurrentMonth,
    },
  };
});
