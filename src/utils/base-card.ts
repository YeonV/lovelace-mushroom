import { HassEntity } from "home-assistant-js-websocket";
import { html, nothing, TemplateResult } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { computeRTL, computeStateDisplay, HomeAssistant, isActive, isAvailable } from "../ha";
import setupCustomlocalize from "../localize";
import "../shared/badge-icon";
import "../shared/card";
import { Appearance, AppearanceSharedConfig } from "../shared/config/appearance-config";
import { EntitySharedConfig } from "../shared/config/entity-config";
import "../shared/shape-avatar";
import "../shared/shape-icon";
import "../shared/state-info";
import "../shared/state-item";
import { computeAppearance } from "./appearance";
import { MushroomBaseElement } from "./base-element";
import { computeInfoDisplay } from "./info";

type BaseConfig = EntitySharedConfig & AppearanceSharedConfig;

export function computeDarkMode(hass?: HomeAssistant): boolean {
    if (!hass) return false;
    return (hass.themes as any).darkMode as boolean;
}
export class MushroomBaseCard extends MushroomBaseElement {
    protected renderPicture(picture: string): TemplateResult {
        return html`
            <mushroom-shape-avatar
                slot="icon"
                .picture_url=${(this.hass as any).hassUrl(picture)}
            ></mushroom-shape-avatar>
        `;
    }

    protected renderNotFound(config: BaseConfig): TemplateResult {
        const appearance = computeAppearance(config);
        const rtl = computeRTL(this.hass);

        const customLocalize = setupCustomlocalize(this.hass);

        return html`
            <ha-card class=${classMap({ "fill-container": appearance.fill_container })}>
                <mushroom-card .appearance=${appearance} ?rtl=${rtl}>
                    <mushroom-state-item ?rtl=${rtl} .appearance=${appearance} disabled>
                        <mushroom-shape-icon
                            slot="icon"
                            disabled
                            icon="mdi:help"
                        ></mushroom-shape-icon>
                        <mushroom-badge-icon
                            slot="badge"
                            class="not-found"
                            icon="mdi:exclamation-thick"
                        ></mushroom-badge-icon>
                        <mushroom-state-info
                            slot="info"
                            .primary=${config.entity}
                            secondary=${customLocalize("card.not_found")}
                        ></mushroom-state-info>
                    </mushroom-state-item>
                </mushroom-card>
            </ha-card>
        `;
    }

    protected renderIcon(stateObj: HassEntity, icon: string): TemplateResult {
        const active = isActive(stateObj);
        return html`
            <mushroom-shape-icon
                slot="icon"
                .disabled=${!active}
                .icon=${icon}
            ></mushroom-shape-icon>
        `;
    }

    protected renderBadge(stateObj: HassEntity) {
        const unavailable = !isAvailable(stateObj);
        return unavailable
            ? html`
                  <mushroom-badge-icon
                      class="unavailable"
                      slot="badge"
                      icon="mdi:help"
                  ></mushroom-badge-icon>
              `
            : nothing;
    }

    protected renderStateInfo(
        stateObj: HassEntity,
        appearance: Appearance,
        name: string,
        state?: string,
        additional?: string
    ): TemplateResult | null {
        const defaultState = computeStateDisplay(
            this.hass.localize,
            stateObj,
            this.hass.locale,
            this.hass.entities,
            this.hass.connection.haVersion
        );
        const displayState = state ?? defaultState;

        const primary = computeInfoDisplay(
            appearance.primary_info,
            name,
            displayState,
            stateObj,
            this.hass
        );

        const secondary = computeInfoDisplay(
            appearance.secondary_info,
            name,
            displayState,
            stateObj,
            this.hass
        );

        return html`
            <mushroom-state-info
                slot="info"
                .primary=${primary}
                .secondary=${secondary}${additional || ''}
            ></mushroom-state-info>
        `;
    }
}
