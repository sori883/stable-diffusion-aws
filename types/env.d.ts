declare module "process" {
  global {
    // biome-ignore lint/style/noNamespace: <explanation>
    namespace NodeJS {
      interface ProcessEnv {
        readonly NODE_ENV?: string;
        readonly ACCOUNTID: string;
      }
    }
  }
}
