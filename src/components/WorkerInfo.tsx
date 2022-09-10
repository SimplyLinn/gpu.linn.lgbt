import { useEffect, useMemo, useState } from 'react';
import useWorkerInfo from 'src/contexts/workerInfo';
import Skeleton from 'react-loading-skeleton';
import Status from './WorkerStatus';
import { Data as WorkerData } from 'src/pages/api/workerStatus';

const CostFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function niceBytes(x: string | null) {
  if (!x) return 'n/a';
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let l = 0,
    n = parseInt(x, 10) || 0;
  // eslint-disable-next-line no-plusplus
  while (n >= 1024 && ++l) {
    n = n / 1024;
  }
  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l];
}

function Table({
  worker,
  lastUpdatedString,
  isError,
  isRefreshing,
}: {
  worker: WorkerData | null;
  isError: boolean;
  isRefreshing: boolean;
  lastUpdatedString: string;
}) {
  return (
    <table className="text-xs w-64 h-36 table-fixed">
      <thead>
        <tr>
          <th colSpan={2}>
            {worker ? (
              `${worker.name} (${worker.id})`
            ) : (
              <>
                <Skeleton width={60} inline /> <Skeleton width={40} inline />
              </>
            )}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th className="text-right pr-1 border-r border-gray-400 w-1/2">
            CPUs
          </th>
          <td className="pl-1 w-1/2">
            {worker ? worker.cpus : <Skeleton width={20} inline />}
          </td>
        </tr>
        <tr>
          <th className="text-right pr-1 border-r border-gray-400">RAM</th>
          <td className="pl-1">
            {worker ? (
              niceBytes(worker.ram)
            ) : (
              <>
                <Skeleton width={20} inline /> <Skeleton width={20} inline />
              </>
            )}
          </td>
        </tr>
        <tr>
          <th className="text-right pr-1 border-r border-gray-400">GPU</th>
          <td className="pl-1">
            {worker ? worker.gpu || 'n/a' : <Skeleton width={80} inline />}
          </td>
        </tr>
        <tr>
          <th className="text-right pr-1 border-r border-gray-400">State</th>
          <td className="pl-1">
            {worker ? (
              <Status status={worker.state} className="flex items-center" />
            ) : (
              <>
                <Skeleton width={15} inline /> <Skeleton width={80} inline />
              </>
            )}
          </td>
        </tr>
        <tr>
          <th className="text-right pr-1 border-r border-gray-400">
            Cost current month
          </th>
          <td className="pl-1">
            {worker ? (
              CostFormatter.format(worker.costs.currentMonth.totalCost)
            ) : (
              <Skeleton width={40} inline />
            )}
          </td>
        </tr>
        <tr>
          <th className="text-right pr-1 border-r border-gray-400">
            Cost last month
          </th>
          <td className="pl-1">
            {worker ? (
              CostFormatter.format(worker.costs.previousMonth.totalCost)
            ) : (
              <Skeleton width={40} inline />
            )}
          </td>
        </tr>
        <tr>
          <th className="text-right pr-1 border-r border-gray-400">
            Last updated
          </th>
          <td
            className="pl-1"
            style={{ color: isError && !isRefreshing ? 'red' : undefined }}
          >
            {worker ? (
              lastUpdatedString
            ) : (
              <>
                <Skeleton width={40} inline /> <Skeleton width={40} inline />
              </>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default function WorkerInfo() {
  const { worker, lastFetched, isRefreshing, isError } = useWorkerInfo();

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const lastUpdatedString = useMemo(() => {
    if (lastFetched == null) return '';
    const diff = Math.max(now.getTime() - lastFetched.getTime(), 0);
    const seconds = Math.floor(diff / 1000);
    return seconds === 0 ? 'just now' : `${seconds} seconds ago`;
  }, [now, lastFetched]);

  if (!isRefreshing && !worker) return null;

  return (
    <Table
      worker={worker}
      lastUpdatedString={lastUpdatedString}
      isError={isError}
      isRefreshing={isRefreshing}
    />
  );
}
