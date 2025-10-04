import type {
  API,
  BlockTool,
  BlockToolConstructorOptions,
  ToolConfig,
} from "@editorjs/editorjs";

interface CustomHeaderData {
  text: string;
  level: number;
  style: "default" | "gradient" | "outlined" | "shadowed" | "colored";
  color?: string;
}

interface CustomHeaderConfig extends ToolConfig {
  placeholder?: string;
  levels?: number[];
  styles?: Array<{
    name: string;
    value: string;
    label: string;
  }>;
  colors?: string[];
  defaultLevel?: number;
  defaultStyle?: string;
}

export default class CustomHeaderTool implements BlockTool {
  private api: API;
  private config: CustomHeaderConfig;
  private data: CustomHeaderData;
  private wrapper: HTMLElement | null = null;
  private settingsWrapper: HTMLElement | null = null;

  static get toolbox() {
    return {
      title: "Custom Header",
      icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg"><path d="M1.77778 7.55556V0H0V15H1.77778V9.33333H8.55556V15H10.3333V0H8.55556V7.55556H1.77778ZM12.1111 13.2222V9.33333H17V7.55556H12.1111V1.77778H17V0H10.3333V15H17V13.2222H12.1111Z"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, config, api }: BlockToolConstructorOptions) {
    this.api = api;
    this.config = {
      placeholder: config?.placeholder || "Enter your header...",
      levels: config?.levels || [1, 2, 3, 4, 5, 6],
      styles: config?.styles || [
        { name: "default", value: "default", label: "Default" },
        { name: "gradient", value: "gradient", label: "Gradient" },
        { name: "outlined", value: "outlined", label: "Outlined" },
        { name: "shadowed", value: "shadowed", label: "Shadowed" },
        { name: "colored", value: "colored", label: "Colored" },
      ],
      colors: config?.colors || [
        "#FF6B6B",
        "#4ECDC4",
        "#45B7D1",
        "#96CEB4",
        "#FFEAA7",
        "#DDA0DD",
        "#98D8C8",
      ],
      defaultLevel: config?.defaultLevel || 2,
      defaultStyle: config?.defaultStyle || "default",
      ...config,
    };

    this.data = {
      text: data?.text || "",
      level: data?.level || this.config.defaultLevel!,
      style: data?.style || this.config.defaultStyle!,
      color: data?.color || this.config.colors![0],
    };

    // Add CSS styles
    this.addStyles();
  }

  render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("custom-header-wrapper");

    const header = this.createHeaderElement();
    this.wrapper.appendChild(header);

    return this.wrapper;
  }

  private createHeaderElement(): HTMLElement {
    const headerTag = `h${this.data.level}` as keyof HTMLElementTagNameMap;
    const header = document.createElement(headerTag);

    header.classList.add("custom-header");
    header.classList.add(`custom-header--${this.data.style}`);
    header.contentEditable = "true";
    header.dataset.placeholder = this.config.placeholder || "";

    // Apply custom color if style is 'colored'
    if (this.data.style === "colored" && this.data.color) {
      header.style.color = this.data.color;
    }

    // Apply gradient if style is 'gradient'
    if (this.data.style === "gradient") {
      header.style.background =
        "linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1)";
      header.style.webkitBackgroundClip = "text";
      header.style.webkitTextFillColor = "transparent";
      header.style.backgroundClip = "text";
    }

    header.textContent = this.data.text;

    header.addEventListener("input", (event) => {
      this.data.text = (event.target as HTMLElement).textContent || "";
    });

    header.addEventListener("keydown", (event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Enter") {
        keyboardEvent.preventDefault();
        this.api.blocks.insert();
      }
    });

    return header;
  }

  renderSettings(): HTMLElement {
    this.settingsWrapper = document.createElement("div");
    this.settingsWrapper.classList.add("custom-header-settings");

    // Level selector
    const levelGroup = this.createSettingsGroup("Header Level");
    const levelSelect = this.createLevelSelector();
    levelGroup.appendChild(levelSelect);
    this.settingsWrapper.appendChild(levelGroup);

    // Style selector
    const styleGroup = this.createSettingsGroup("Text Style");
    const styleSelect = this.createStyleSelector();
    styleGroup.appendChild(styleSelect);
    this.settingsWrapper.appendChild(styleGroup);

    // Color selector (only show if style is 'colored')
    if (this.data.style === "colored") {
      const colorGroup = this.createSettingsGroup("Text Color");
      const colorPicker = this.createColorPicker();
      colorGroup.appendChild(colorPicker);
      this.settingsWrapper.appendChild(colorGroup);
    }

    return this.settingsWrapper;
  }

  private createSettingsGroup(title: string): HTMLElement {
    const group = document.createElement("div");
    group.classList.add("custom-header-settings-group");

    const label = document.createElement("label");
    label.textContent = title;
    label.classList.add("custom-header-settings-label");
    group.appendChild(label);

    return group;
  }

  private createLevelSelector(): HTMLElement {
    const select = document.createElement("select");
    select.classList.add("custom-header-level-select");

    this.config.levels!.forEach((level) => {
      const option = document.createElement("option");
      option.value = level.toString();
      option.textContent = `H${level}`;
      option.selected = level === this.data.level;
      select.appendChild(option);
    });

    select.addEventListener("change", (event) => {
      const newLevel = parseInt((event.target as HTMLSelectElement).value);
      this.data.level = newLevel;
      this.updateHeader();
    });

    return select;
  }

  private createStyleSelector(): HTMLElement {
    const select = document.createElement("select");
    select.classList.add("custom-header-style-select");

    this.config.styles!.forEach((style) => {
      const option = document.createElement("option");
      option.value = style.value;
      option.textContent = style.label;
      option.selected = style.value === this.data.style;
      select.appendChild(option);
    });

    select.addEventListener("change", (event) => {
      const newStyle = (event.target as HTMLSelectElement)
        .value as CustomHeaderData["style"];
      this.data.style = newStyle;
      this.updateHeader();
      // Re-render settings to show/hide color picker
      this.updateSettings();
    });

    return select;
  }

  private createColorPicker(): HTMLElement {
    const colorContainer = document.createElement("div");
    colorContainer.classList.add("custom-header-color-picker");

    this.config.colors!.forEach((color) => {
      const colorButton = document.createElement("button");
      colorButton.classList.add("custom-header-color-button");
      colorButton.style.backgroundColor = color;
      colorButton.title = color;

      if (color === this.data.color) {
        colorButton.classList.add("active");
      }

      colorButton.addEventListener("click", () => {
        // Remove active class from all buttons
        colorContainer
          .querySelectorAll(".custom-header-color-button")
          .forEach((btn) => {
            btn.classList.remove("active");
          });

        // Add active class to clicked button
        colorButton.classList.add("active");

        this.data.color = color;
        this.updateHeader();
      });

      colorContainer.appendChild(colorButton);
    });

    return colorContainer;
  }

  private updateHeader(): void {
    if (this.wrapper) {
      // Remove the old header and create a new one
      const oldHeader = this.wrapper.querySelector(".custom-header");
      if (oldHeader) {
        oldHeader.remove();
      }

      const newHeader = this.createHeaderElement();
      this.wrapper.appendChild(newHeader);
    }
  }

  private updateSettings(): void {
    if (this.settingsWrapper) {
      // Clear and re-render settings
      this.settingsWrapper.innerHTML = "";

      const newSettings = this.renderSettings();
      this.settingsWrapper.replaceWith(newSettings);
      this.settingsWrapper = newSettings;
    }
  }

  save(): CustomHeaderData {
    const headerElement = this.wrapper?.querySelector(
      ".custom-header"
    ) as HTMLElement;
    if (headerElement) {
      this.data.text = headerElement.textContent || "";
    }

    return {
      text: this.data.text,
      level: this.data.level,
      style: this.data.style,
      color: this.data.color,
    };
  }

  validate(savedData: CustomHeaderData): boolean {
    return savedData.text.trim().length > 0;
  }

  static get sanitize() {
    return {
      text: {},
      level: false,
      style: false,
      color: false,
    };
  }

  private addStyles(): void {
    const styleId = "custom-header-styles";

    // Check if styles are already added
    if (document.getElementById(styleId)) {
      return;
    }

    const styles = `
      <style id="${styleId}">
        .custom-header-wrapper {
          margin: 1em 0;
        }

        .custom-header {
          margin: 0;
          padding: 0.5em 0;
          font-weight: bold;
          line-height: 1.2;
          outline: none;
          transition: all 0.3s ease;
        }

        .custom-header:empty:before {
          content: attr(data-placeholder);
          color: #ccc;
          font-style: italic;
        }

        .custom-header--default {
          color: inherit;
        }

        .custom-header--gradient {
          background: linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800;
        }

        .custom-header--outlined {
          color: transparent;
          -webkit-text-stroke: 2px #333;
          text-stroke: 2px #333;
          font-weight: 800;
        }

        .custom-header--shadowed {
          color: #333;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          font-weight: 700;
        }

        .custom-header--colored {
          font-weight: 700;
        }

        .custom-header-settings {
          padding: 10px;
          border: 1px solid #e8e8eb;
          border-radius: 6px;
          background: #fff;
          max-width: 300px;
        }

        .custom-header-settings-group {
          margin-bottom: 15px;
        }

        .custom-header-settings-group:last-child {
          margin-bottom: 0;
        }

        .custom-header-settings-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #707684;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .custom-header-level-select,
        .custom-header-style-select {
          width: 100%;
          padding: 6px 10px;
          border: 1px solid #e8e8eb;
          border-radius: 4px;
          font-size: 13px;
          background: #fff;
          cursor: pointer;
        }

        .custom-header-level-select:focus,
        .custom-header-style-select:focus {
          outline: none;
          border-color: #388ae5;
        }

        .custom-header-color-picker {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .custom-header-color-button {
          width: 24px;
          height: 24px;
          border: 2px solid transparent;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
        }

        .custom-header-color-button:hover {
          transform: scale(1.1);
        }

        .custom-header-color-button.active {
          border-color: #388ae5;
          transform: scale(1.1);
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .custom-header-settings {
            background: #2d2d2d;
            border-color: #404040;
          }

          .custom-header-level-select,
          .custom-header-style-select {
            background: #2d2d2d;
            border-color: #404040;
            color: #fff;
          }

          .custom-header--outlined {
            -webkit-text-stroke-color: #fff;
            text-stroke-color: #fff;
          }

          .custom-header--shadowed {
            color: #fff;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML("beforeend", styles);
  }
}
