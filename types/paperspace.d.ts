declare module 'paperspace-node' {
  export type OptionsCamel = {
    authEmail?: string;
    accessToken?: string;
    apiKey?: string;
  };

  export type OptionsSnake = {
    email?: string;
    access_token?: string;
    api_key?: string;
  };

  type Callback<TResult = unknown> = (err: any, result: TResult) => void;

  export type Options = OptionsCamel | OptionsSnake;

  export type MachineType =
    | 'Air'
    | 'Standard'
    | 'Pro'
    | 'Advanced'
    | 'GPU+'
    | 'P4000'
    | 'P5000'
    | 'P6000'
    | 'V100'
    | 'C1'
    | 'C2'
    | 'C3'
    | 'C4'
    | 'C5'
    | 'C6'
    | 'C7'
    | 'C8'
    | 'C9'
    | 'C10';

  export type Region =
    | 'East Coast (NY2)'
    | 'West Coast (CA1)'
    | 'Europe (AMS1)';

  export type MachineEvent = {
    name: string;
    state: string;
    errorMsg: string;
    handle: string;
    dtModified: string;
    dtFinished: string;
    dtCreated: string;
  };

  export type MachineCreateParams = {
    /** Name of the region: either `East Coast (NY2)`, `West Coast (CA1)`, or `Europe (AMS1)` */
    region: Region;
    /**
     * Machine type: either 'Air', 'Standard', 'Pro', 'Advanced', 'GPU+', 'P4000', 'P5000', 'P6000', 'V100', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', or 'C10'
     *
     * Note:
     * Windows os templates cannot be used to create CPU-only machine types 'C1' - 'C10'.
     * Ubuntu os templates cannot be used to create GRID GPU machine types: 'Air', 'Standard', 'Pro', or 'Advanced'.
     */
    machineType: MachineType;
    /** Storage size for the machine in GB */
    size: number;
    /** Either 'monthly' or 'hourly' billing */
    billingType: 'monthly' | 'hourly';
    /** A memorable name for this machine */
    machineName: string;
    /** Template id of the template to use for creating this machine */
    templateId: string;
    /** If creating the machine for a team, specify the team id */
    teamId?: string;
    /** Assign a new public ip address on machine creation. Cannot be used with dynamicPublicIp. */
    assignPublicIp?: boolean;
    /** Assigns a new public ip address on machine start and releases it from the account on machine stop. Cannot be used with assignPublicIp. */
    dynamicPublicIp?: boolean;
    /** Start the VM immediately after creation. Defaults to `true`. */
    startOnCreate?: boolean;
    /** If creating on a specific network, specify its id */
    networkId?: string;
    /** The script id of a script to be run on startup.  See the [Script Guide]{@link https://paperspace.github.io/paperspace-node/scripts.md} for more info on using scripts. */
    scriptId?: string;
    /** If assigning to an existing user other than yourself, specify the user id (mutually exclusive with email, password, firstName, lastName) */
    userId?: string;
    /** If creating a new user for this machine, specify their email address (mutually exclusive with userId) */
    email?: string;
    /** If creating a new user, specify their password (mutually exclusive with userId) */
    password?: string;
    /** If creating a new user, specify their first name (mutually exclusive with userId) */
    firstName?: string;
    /** If creating a new user, specify their last name (mutually exclusive with userId) */
    lastName?: string;
    /** Send a notification to this email address when complete */
    notificationEmail?: string;
    /** Take a snapshot of the VM at first boot. */
    takeInitialSnapshot?: boolean;
    /** Use initial snapshot as a restore point for the VM. If this is true `takeInitialSnapshot` must be true and `restorePointFrequency` must be specified. */
    markSnapshotAsRestorePoint?: boolean;
    /** How often the VM's restore point should be used. Valid options: `shutdown`. */
    restorePointFrequency?: string;
  };

  export interface MachineCreatedInfo {
    id: string;
    name: string;
    os: string | null;
    ram: string | null;
    cpus: number;
    gpu: string | null;
    storageTotal: string | null;
    storageUsed: string | null;
    usageRate: string;
    shutdownTimeoutInHours: number | null;
    shutdownTimeoutForces: boolean;
    performAutoSnapshot: boolean;
    autoSnapshotFrequency: string | null;
    autoSnapshotSaveCount: number | null;
    agentType: string;
    dtCreated: string;
    /**
     *
     * * `starting` - machine is in the process of changing to the ready or serviceready state
     * * `stopping` - machine is in the process of changing to the off state
     * * `restarting` - combines stopping follow immediately by starting
     * * `serviceready` - services are running on the machine but the Paperspace agent is not yet available
     * * `ready` - services are running on machine and the Paperspace agent is ready to stream or accept logins
     * * `upgrading` - the machine specification are being upgraded, which involves a shutdown and startup sequence
     * * `provisioning` - the machine is in the process of being created for the first time
     */
    state:
      | 'off'
      | 'starting'
      | 'stopping'
      | 'restarting'
      | 'serviceready'
      | 'ready'
      | 'upgrading'
      | 'provisioning';
    /**
     * The updatesPending property is either true or false and reflects whether the operating system has scheduled updates for the next machine state transition,
     * e.g, stopping, starting, restarting, or upgrading.
     *
     * Note: in some cases, the operating system can force installation of critical updates immediately upon a state transition,
     * or automatically restart a machine to install updates.
     * In such cases, the updatesPending property may not always be set accurately by the underlying os.
     */
    updatesPending: boolean;
    networkId: string | null;
    privateIpAddress: string | null;
    publicIpAddress: string | null;
    region: Region | null;
    userId: string;
    teamId: string;
    scriptId: string | null;
    dtLastRun: string | null;
    dynamicPublicIp: null | boolean;
    events: MachineEvent[];
  }

  export interface MachineInfo extends MachineCreatedInfo {
    restorePointSnapshotId: string | null;
    restorePointFrequency: 'shutdown' | null;
  }

  interface BaseUtilization {
    machineId: string;
    secondsUsed: number;
    billingMonth: `${number}-${number}`;
  }

  interface HourlyUtilization extends BaseUtilization {
    hourlyRate: `${number}`;
  }

  interface MonthlyUtilization extends BaseUtilization {
    monthlyRate: `${number}`;
  }

  export type Utilizations = {
    machineId: string;
    utilization: HourlyUtilization | MonthlyUtilization;
    storageUtilization: HourlyUtilization | MonthlyUtilization;
  };

  type Paperspace = {
    machines: {
      /**
       * Create a new Paperspace virtual machine. If you are using an individual account,
       * you will be assigned as the owner of the machine. If you are a team administrator, you must
       * specify the user that should be assigned to the machine, either by specifing a user id, or by providing an email address, password, first name and
       * last name for the creation of a new user on the team.  (The email address must not already be associated with a Paperspace account, otherwise a user creation error is returned.)
       *
       * Note: if you attempt to create a new user along with the machine, the user creation step is executed before the creation of the machine.
       * Therefore, if an error occurs, the user creation step may or may not have succeeded.  To deal with this, if an error object is returned from the `machines create`
       * method, subsquently call the `users list` method (with a search filter specifying the email address) to check if the user creation step succeeded.
       *
       * Note: machine creation is not always guaranteed to succeed, due to various possible issues such as machine availability, billing issues, resource issues, or system errors.
       * However you can call the `machines availability` method to check for current point-in-time availability of a given machine type.
       *
       * This machine create action can only be performed by the account owner. (Team members cannot create machines themselves; only the team administrator may do so.)
       * @param params - Machine creation parameters
       * @param {function} cb - Node-style error-first callback function
       * @returns {object} machine - The created machine JSON object
       */
      create(
        params: MachineCreateParams,
        cb: Callback<MachineCreatedInfo>,
      ): void;
      start(params: { machineId: string }, cb: Callback): void;
      stop(params: { machineId: string }, cb: Callback): void;
      restart(params: { machineId: string }, cb: Callback): void;
      destroy(
        params: { machineId: string; releasePublicIp?: boolean },
        cb: Callback,
      ): void;
      show(params: { machineId: string }, cb: Callback<MachineInfo>): void;
      utilization(
        params: { machineId: string; billingMonth: string },
        cb: Callback<Utilizations>,
      ): void;
    };
  };

  type Endpoints =
    | 'jobs'
    | 'login'
    | 'logout'
    | 'machines'
    | 'resourceDelegations'
    | 'networks'
    | 'projects'
    | 'scripts'
    | 'templates'
    | 'users';

  declare const paperspace: ((options: Options) => Paperspace) & {
    readonly VERSION: string;
    eachEndpoint: (
      fn: (
        namespace: string,
        name: string,
        method: (params: unknown, cb: Callback<unknown>) => void,
      ) => void,
    ) => void;
  };

  export default paperspace;
}
