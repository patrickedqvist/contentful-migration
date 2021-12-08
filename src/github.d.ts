declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_WORKSPACE: string
    }
  }
}

export {}
