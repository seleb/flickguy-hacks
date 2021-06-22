/**
🖌
@file pressure
@summary adds pressure sensitivity to paint tool
@license MIT
@version auto
@author Sean S. LeBlanc

@description
Adds a toggle to the brush selection that
enables/disables pressure sensitivity.

When pressure sensitivity is enabled,
brush selection will automatically update to match pressure.

If the input device doesn't support pressure, the toggle is disabled.

HOW TO USE:
Copy-paste this script into a script tag in your flickguy
*/
import Pressure from 'pressure';
import { before } from './helpers/kitsy-script-toolkit';

export const hackOptions = {
	source: 'https://github.com/seleb/flickguy-hacks/blob/main/dist/pressure.js',
	// whether pressure sensitivity is enabled by default
	enabled: true,
};

const id = 'pressure';
let pressureInput;
before('Editor.prototype.init', function () {
	if (!document.getElementById(id)) {
		const optionLabel = document.createElement('label');
		optionLabel.style.display = 'flex';
		optionLabel.style.alignItems = 'center';
		optionLabel.style.justifyContent = 'center';
		optionLabel.style.color = '#000';
		optionLabel.style.fontWeight = 'bold';
		optionLabel.title = 'pressure sensitivity';
		const optionInput = document.createElement('input');
		optionInput.type = 'checkbox';
		optionInput.id = id;
		optionInput.name = id;
		optionInput.value = 'pressure';
		optionInput.style.appearance = 'none';
		optionInput.style.mozAppearance = 'none';
		optionInput.style.webkitAppearance = 'none';
		optionInput.style.margin = '0';
		optionInput.style.borderRadius = 'inherit';
		optionInput.style.position = 'absolute';
		optionInput.style.width = '100%';
		optionInput.style.height = '100%';
		optionLabel.appendChild(optionInput);
		const optionIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		optionIcon.setAttributeNS(null, 'width', 16);
		optionIcon.setAttributeNS(null, 'height', 16);
		optionIcon.setAttributeNS(null, 'fill', 'currentColor');
		optionIcon.setAttributeNS(null, 'viewBox', '0 0 16 16');
		optionIcon.innerHTML = '<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM4 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0z"/><path d="M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>';
		optionLabel.appendChild(optionIcon);

		document.getElementById('brush-select').appendChild(optionLabel);
	}

	pressureInput = document.getElementById(id);
	pressureInput.onchange = () => {
		if (pressureInput.checked) {
			pressureInput.style.background = 'blue';
			pressureInput.nextSibling.style.color = '#FFF';
		} else {
			pressureInput.style.background = 'none';
			pressureInput.nextSibling.style.color = 'inherit';
		}
	};
	pressureInput.checked = hackOptions.enabled;
	pressureInput.onchange();
	const brushes = this.brushSelect.inputs;
	const toolSelect = this.toolSelect;
	Pressure.set(
		'#renderer',
		{
			change: function (force) {
				// re-enable (user may be switching between devices)
				if (pressureInput.disabled) {
					pressureInput.disabled = false;
					pressureInput.parentElement.title = 'pressure sensitivity';
					pressureInput.parentElement.style.opacity = 1;
				}

				// if painting + pressure enabled
				if (toolSelect.selectedIndex === 0 && pressureInput.checked) {
					// change brush selection based on pressure
					const idx = Math.min(Math.floor(force * brushes.length), brushes.length - 1);
					brushes[idx].checked = true;
				}
			},
			unsupported: function () {
				// disable the pressure input if you can't use it
				pressureInput.disabled = true;
				pressureInput.parentElement.title = 'device does not support pressure sensitivity';
				pressureInput.parentElement.style.opacity = 0.4;
			},
		},
		{
			// pressurejs's polyfill behaviour is a bit weird, especially for drawing
			polyfill: false,
		},
	);
});

// prevent remixed editors from breaking due to injected "brush" option
before('Editor.prototype.exportProject', function () {
	const parent = pressureInput.parentElement.parentElement;
	pressureInput.parentElement.remove();
	const c = document.documentElement.cloneNode;
	document.documentElement.cloneNode = (deep) => {
		document.documentElement.cloneNode = c;
		const result = document.documentElement.cloneNode(deep);
		parent.appendChild(pressureInput.parentElement);
		return result;
	};
});
