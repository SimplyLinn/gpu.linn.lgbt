import { MachineInfo } from 'paperspace-node';
import {
  IoChevronDownCircle,
  IoChevronUpCircle,
  IoCloudCircle,
  IoEllipsisHorizontalCircleSharp,
  IoHelpCircle,
  IoPlayCircle,
  IoPlayCircleOutline,
  IoReloadCircle,
  IoStopCircle,
} from 'react-icons/io5';

const Unknown = Symbol('unknown');

const COLORS = {
  off: 'currentColor',
  provisioning: '#fce83a',
  ready: '#56f000',
  restarting: '#fce83a',
  serviceready: '#2dccff',
  starting: '#fce83a',
  stopping: '#fce83a',
  upgrading: '#fce83a',
  [Unknown]: '#ff3838',
} as const;

export default function Status({
  status,
  className,
}: {
  status: MachineInfo['state'];
  className?: string;
}) {
  const color = COLORS[status] ?? COLORS[Unknown];
  switch (status) {
    case 'off':
      return (
        <div className={className} style={{ color }}>
          <IoStopCircle className="mr-1" />
          <span>Stopped</span>
        </div>
      );
    case 'provisioning':
      return (
        <div className={className} style={{ color }}>
          <IoEllipsisHorizontalCircleSharp className="mr-1" />
          Provisioning
        </div>
      );
    case 'ready':
      return (
        <div className={className} style={{ color }}>
          <IoPlayCircle className="mr-1" />
          Ready
        </div>
      );
    case 'restarting':
      return (
        <div className={className} style={{ color }}>
          <IoReloadCircle className="mr-1" />
          Restarting
        </div>
      );
    case 'serviceready':
      return (
        <div className={className} style={{ color }}>
          <IoPlayCircleOutline className="mr-1" />
          Started
        </div>
      );
    case 'starting':
      return (
        <div className={className} style={{ color }}>
          <IoChevronUpCircle className="mr-1" />
          Starting
        </div>
      );
    case 'stopping':
      return (
        <div className={className} style={{ color }}>
          <IoChevronDownCircle className="mr-1" />
          Stopping
        </div>
      );
    case 'upgrading':
      return (
        <div className={className} style={{ color }}>
          <IoCloudCircle className="mr-1" />
          Upgrading
        </div>
      );
    default:
      return (
        <div className={className} style={{ color }}>
          <IoHelpCircle className="mr-1" />
          Unknown status ({status})
        </div>
      );
  }
}
