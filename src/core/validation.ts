/**
 * The Validation service handles the registration and validation of configuration flags.
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { FLAG_USERNAME, FLAG_USE_GIT_CHECKPOINT } from "./constants";

export interface AppConfig {
  username: string;
  useGitCheckpoint: boolean;
}

const configSchema = {
  [FLAG_USERNAME]: {
    type: "string",
    description: "Your name for personalized greetings.",
    default: "User",
  },
  [FLAG_USE_GIT_CHECKPOINT]: {
    type: "boolean",
    description: "Automatically commit to git after writing a file.",
    default: true,
  },
};

export class ConfigValidator {
  constructor(private readonly api: ExtensionAPI) {
    this.registerFlags();
  }

  private registerFlags() {
    for (const [name, options] of Object.entries(configSchema)) {
      this.api.registerFlag(name, options);
    }
  }

  /**
   * Retrieves and validates all configuration flags.
   * Throws an error if any required flag is missing.
   */
  get(): AppConfig {
    return {
      username: this.api.getFlag(FLAG_USERNAME) as string,
      useGitCheckpoint: this.api.getFlag(FLAG_USE_GIT_CHECKPOINT) as boolean,
    };
  }
}
