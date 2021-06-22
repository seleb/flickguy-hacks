import { before } from './kitsy-script-toolkit';

/** Adds a radio group if it does not exist
 * @param {string} title user-facing title of group
 * @param {string} id element id of group
 * @param {{ label, title, value }[]} options array of radio options
 * @param {(newValue) => void} onChange called when value changes
 */
export function addRadioGroup(hackOptions, title, id, options, onChange) {
	before('Editor.prototype.init', function () {
		if (!document.getElementById(id)) {
			const container = document.createElement('div');
			container.style.display = 'flex';
			container.style.gap = '1em';
			const radioGroup = document.createElement('div');
			radioGroup.className = 'horizontal-capsule radio-select';
			radioGroup.id = id;
			radioGroup.title = title;
			radioGroup.style.flex = 'auto';
			radioGroup.style.overflowX = 'auto';

			options.forEach((option) => {
				const optionLabel = document.createElement('label');
				optionLabel.style.display = 'flex';
				optionLabel.style.alignItems = 'center';
				optionLabel.style.justifyContent = 'center';
				optionLabel.style.color = '#000';
				optionLabel.style.fontWeight = 'bold';
				const optionInput = document.createElement('input');
				optionInput.type = 'radio';
				optionInput.name = id;
				optionInput.value = option.value;
				optionInput.title = option.title;
				optionLabel.appendChild(optionInput);
				const optionName = document.createElement('span');
				optionName.textContent = option.label;
				optionName.style.position = 'relative';
				optionName.style.padding = '0.25em';
				optionLabel.appendChild(optionName);
				radioGroup.appendChild(optionLabel);
			});
			container.appendChild(radioGroup);

			const about = document.createElement('button');
			about.textContent = '?';
			about.title = title + ' - non-standard flickguy feature, click to view source';
			about.style.flex = 'none';
			about.style.padding = '0.5em';
			about.dataset.hiddenInPlayer = true;
			about.onclick = () => {
				window.open(hackOptions.source, '_blank');
			};
			container.appendChild(about);

			document.getElementById('layer-options').insertAdjacentElement('afterend', container);
		}

		// init styles
		document.querySelectorAll(`#${id} span`).forEach((span) => { span.style.color = 'inherit'; });
		document.querySelector(`#${id} label:first-of-type input`).checked = true;
		document.querySelector(`#${id} label:first-of-type span`).style.color = '#FFF';
		// hook up listener
		const onInputChange = (event) => {
			document.querySelectorAll(`#${id} span`).forEach((span) => { span.style.color = 'inherit'; });
			event.currentTarget.nextSibling.style.color = '#FFF';
			onChange(event.currentTarget.value);
		};
		document.querySelectorAll(`#${id} input`).forEach((input) => { input.onchange = onInputChange; });
	});
}
