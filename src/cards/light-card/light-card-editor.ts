import { html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import memoizeOne from "memoize-one";
import { assert } from "superstruct";
import { LovelaceCardEditor, fireEvent } from "../../ha";
import setupCustomlocalize from "../../localize";
import { computeActionsFormSchema } from "../../shared/config/actions-config";
import { APPEARANCE_FORM_SCHEMA } from "../../shared/config/appearance-config";
import { MushroomBaseElement } from "../../utils/base-element";
import { GENERIC_LABELS } from "../../utils/form/generic-fields";
import { HaFormSchema } from "../../utils/form/ha-form";
import { stateIcon } from "../../utils/icons/state-icon";
import { loadHaComponents } from "../../utils/loader";
import { LIGHT_CARD_EDITOR_NAME, LIGHT_ENTITY_DOMAINS, LIGHT_SWITCH_DOMAINS } from "./const";
import { LightCardConfig, lightCardConfigStruct } from "./light-card-config";

export const LIGHT_LABELS = [
    "show_brightness_control",
    "use_light_color",
    "show_color_temp_control",
    "show_color_control",
    "use_entity_two",
    "use_icon_two",
    "use_attribute_two",
    "entity_two",
    "icon_two",
    "attribute_two",
];

const computeSchema = memoizeOne((icon?: string, icon_two: string = 'mdi:power', use_entity_two?: boolean, use_icon_two?: boolean, entity_id_two?: any, use_attribute_two?: boolean): HaFormSchema[] => [
    { name: "entity", selector: { entity: { domain: LIGHT_ENTITY_DOMAINS } } },
    { name: "name", selector: { text: {} } },
    {
        type: "grid",
        name: "",
        schema: [
            { name: "icon", selector: { icon: { placeholder: icon } } },
            { name: "icon_color", selector: { mush_color: {} } },
        ],
    },
    { name: "use_entity_two", selector: { boolean: {} } },
    {
        type: "grid",
        name: "",
        schema: use_entity_two 
            ? use_icon_two 
                ? use_attribute_two 
                    ? [
                        { name: "entity_two", selector: { entity: { domain: LIGHT_SWITCH_DOMAINS } } },
                        { name: "use_icon_two", selector: { boolean: {} } },
                        { name: "icon_two", selector: { icon: { placeholder: icon_two, fallbackPath: 'mdi:power' } } },
                        { name: "use_attribute_two", selector: { boolean: {} } },
                        { name: "attribute_two", selector: { attribute: { entity_id: entity_id_two} } },
                    ] 
                    : [
                        { name: "entity_two", selector: { entity: { domain: LIGHT_SWITCH_DOMAINS } } },
                        { name: "use_icon_two", selector: { boolean: {} } },
                        { name: "icon_two", selector: { icon: { placeholder: icon_two, fallbackPath: 'mdi:power' } } },
                        { name: "use_attribute_two", selector: { boolean: {} } },
                    ] 
                : [
                    { name: "entity_two", selector: { entity: { domain: LIGHT_SWITCH_DOMAINS } } },
                    { name: "use_icon_two", selector: { boolean: {} } },
                ] 
            : [],
    },
    ...APPEARANCE_FORM_SCHEMA,
    {
        type: "grid",
        name: "",
        schema: [
            { name: "use_light_color", selector: { boolean: {} } },
            { name: "show_brightness_control", selector: { boolean: {} } },
            { name: "show_color_temp_control", selector: { boolean: {} } },
            { name: "show_color_control", selector: { boolean: {} } },
            { name: "collapsible_controls", selector: { boolean: {} } },
        ],
    },
    ...computeActionsFormSchema(),
]);

@customElement(LIGHT_CARD_EDITOR_NAME)
export class LightCardEditor extends MushroomBaseElement implements LovelaceCardEditor {
    @state() private _config?: LightCardConfig;

    connectedCallback() {
        super.connectedCallback();
        void loadHaComponents();
    }

    public setConfig(config: LightCardConfig): void {
        assert(config, lightCardConfigStruct);
        this._config = config;
    }

    private _computeLabel = (schema: HaFormSchema) => {
        const customLocalize = setupCustomlocalize(this.hass!);

        if (GENERIC_LABELS.includes(schema.name)) {
            return customLocalize(`editor.card.generic.${schema.name}`);
        }
        if (LIGHT_LABELS.includes(schema.name)) {
            return customLocalize(`editor.card.light.${schema.name}`);
        }
        return this.hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema.name}`);
    };

    protected render() {
        if (!this.hass || !this._config) {
            return nothing;
        }

        const entityState = this._config.entity ? this.hass.states[this._config.entity] : undefined;
        const entityStateTwo = this._config.entity_two
            ? this.hass.states[this._config.entity_two]
            : undefined;
        const entityIcon = entityState ? stateIcon(entityState) : undefined;
        const entityIconTwo = entityStateTwo ? stateIcon(entityStateTwo) : undefined;
        const icon = this._config.icon || entityIcon;
        const icon_two = !this._config.use_icon_two ? 'mdi:power' : this._config.icon_two || entityIconTwo;
        const schema = computeSchema(icon, icon_two, !!this._config.use_entity_two, !!this._config.use_icon_two, this._config.entity_two, !!this._config.use_attribute_two);

        return html`
            <ha-form
                .hass=${this.hass}
                .data=${this._config}
                .schema=${schema}
                .computeLabel=${this._computeLabel}
                @value-changed=${this._valueChanged}
            ></ha-form>
        `;
    }

    private _valueChanged(ev: CustomEvent): void {
        fireEvent(this, "config-changed", { config: ev.detail.value });
    }
}
