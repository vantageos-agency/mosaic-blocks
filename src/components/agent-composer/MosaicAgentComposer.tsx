"use client";

/**
 * MosaicAgentComposer — responsive-pair orchestrator
 *
 * Selects MosaicAgentComposerDesktop or MosaicAgentComposerMobile based on
 * useDevice(). Both variants share the same MosaicAgentComposerProps contract.
 *
 * This is the canonical responsive-pair pattern from the upstream source:
 * orchestrator reads device → delegates to the correct variant → caller never
 * needs to know which renders.
 *
 * Both sub-components are also exported from src/index.ts for consumers who
 * want to bypass device detection and render a specific variant directly.
 *
 * Must be wrapped in MosaicDeviceProvider.
 */

// React import not needed — JSX transform handles it
import { useDevice } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicAgentComposerDesktop } from "./MosaicAgentComposerDesktop.js";
import { MosaicAgentComposerMobile } from "./MosaicAgentComposerMobile.js";
import type { MosaicAgentComposerMobileProps } from "./MosaicAgentComposerMobile.js";

// Re-export shared types for convenience
export type { MosaicAgentComposerProps } from "./MosaicAgentComposerDesktop.js";
export type { MosaicAgentComposerMobileProps } from "./MosaicAgentComposerMobile.js";
export type { MosaicComposerModule, MosaicComposerModel } from "./MosaicAgentComposerDesktop.js";

/**
 * MosaicAgentComposer — device-adaptive composer that renders the Desktop
 * variant on lg+ and the Mobile variant below lg.
 *
 * Wrap in MosaicDeviceProvider. All props flow through unchanged.
 *
 * @example
 * <MosaicDeviceProvider>
 *   <MosaicAgentComposer
 *     agentName={name}
 *     onAgentNameChange={setName}
 *     customInstructions={instructions}
 *     onCustomInstructionsChange={setInstructions}
 *     selectedRole={role}
 *     onSelectRole={openRolePicker}
 *     onRemoveRole={clearRole}
 *     selectedPersona={persona}
 *     onSelectPersona={openPersonaPicker}
 *     onRemovePersona={clearPersona}
 *     selectedFramework={framework}
 *     onSelectFramework={openFrameworkPicker}
 *     onRemoveFramework={clearFramework}
 *     selectedModel={model}
 *     onSelectModel={openModelPicker}
 *     onRemoveModel={clearModel}
 *     onSave={handleSave}
 *     canSave={canSave}
 *   />
 * </MosaicDeviceProvider>
 */
export function MosaicAgentComposer(props: MosaicAgentComposerMobileProps) {
  const { isMobile } = useDevice();
  return isMobile ? (
    <MosaicAgentComposerMobile {...props} />
  ) : (
    <MosaicAgentComposerDesktop {...props} />
  );
}

MosaicAgentComposer.displayName = "MosaicAgentComposer";
