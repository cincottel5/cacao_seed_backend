export type HealthStatus = {
  databaseConnected: boolean;
  datetime: string;
  environment: string;
};

export type GetHealthStatusDependencies = {
  checkDatabaseConnection: () => Promise<boolean>;
  environment: string;
};

export const getHealthStatus = async ({
  checkDatabaseConnection,
  environment
}: GetHealthStatusDependencies): Promise<HealthStatus> => ({
  databaseConnected: await checkDatabaseConnection(),
  datetime: new Date().toISOString(),
  environment
});
