import { env, awsEnv } from "~/env";

export function generateResourceName(name: string, az?: string): string {
  if (!awsEnv.regions.includes(env.region)) {
    throw new Error(`Undefined Region: ${env.region}`);
  }
  return `${env.prefix}-${name}-${generateShortRegionName(env.region)}${az ? `-${generateShortAZName(az)}` : ""}`;
}

function generateShortRegionName(az: string): string {
  return `${az.charAt(0)}${az.charAt(3)}${az.charAt(az.length - 1)}`;
}

function generateShortAZName(az: string): string {
  return az.charAt(az.length - 1);
}
