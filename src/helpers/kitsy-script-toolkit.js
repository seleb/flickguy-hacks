import flickguy from 'flickguy';
import { kitsy } from 'kitsy';

if (!kitsy.hooked) {
	kitsy.hooked = true;
	const startOriginal = flickguy.start;
	flickguy.start = () => {
		kitsy.applyHooks(flickguy);
		startOriginal.call(flickguy);
	};
}

/** @see kitsy.inject */
export var inject = kitsy.inject;
/** @see kitsy.before */
export var before = kitsy.before;
/** @see kitsy.after */
export var after = kitsy.after;
