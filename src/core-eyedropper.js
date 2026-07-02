/**
 * Injects a "Pick from screen" eyedropper button into core color UIs:
 *
 * 1. Color palette popovers (Text/Background/Link dropdowns, theme
 *    styles) — applies the color through the ColorPalette's onChange
 *    prop, the same path a swatch click takes.
 * 2. The custom ColorPicker (opened from "Custom color picker" and from
 *    gradient control points) — commits through the picker's own hex
 *    input, so it also works for gradient stops.
 *
 * Core offers no filter for these components' internals, so we watch
 * for them mounting with a MutationObserver.
 */
import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';

const BUTTON_CLASS = 'colorpicker-core-eyedropper';

const PALETTE_SELECTORS =
	'.block-editor-color-gradient-control__panel, .components-color-palette';

async function openEyedropper() {
	try {
		const { sRGBHex } = await new window.EyeDropper().open();
		return sRGBHex;
	} catch ( error ) {
		return null; // User dismissed the eyedropper.
	}
}

function makeButton( doc, onClick, extraClass = '' ) {
	const button = doc.createElement( 'button' );
	button.type = 'button';
	button.className = `components-button is-secondary is-compact ${ BUTTON_CLASS } ${ extraClass }`;
	button.textContent = __( 'Pick from screen', 'colorpicker' );
	button.addEventListener( 'click', onClick );
	return button;
}

/* ------------------------------------------------------------------ *
 * Palette popovers
 * ------------------------------------------------------------------ */

/**
 * Walk up the React fiber tree from the swatch picker to find the
 * ColorPalette component's onChange prop. Returns null on the Gradient
 * tab (its picker has no `colors` prop up the chain).
 */
function findPaletteOnChange( container ) {
	const anchor =
		container.querySelector( '.components-circular-option-picker' ) ||
		container;
	const fiberKey = Object.keys( anchor ).find( ( key ) =>
		key.startsWith( '__reactFiber$' )
	);
	let fiber = anchor[ fiberKey ];
	while ( fiber ) {
		const props = fiber.memoizedProps;
		if (
			props &&
			typeof props.onChange === 'function' &&
			Array.isArray( props.colors )
		) {
			return props.onChange;
		}
		fiber = fiber.return;
	}
	return null;
}

function injectPaletteButton( container ) {
	if ( container.querySelector( `.${ BUTTON_CLASS }` ) ) {
		return;
	}
	// Skip when no color palette is mounted here (e.g. Gradient tab).
	if ( ! findPaletteOnChange( container ) ) {
		return;
	}

	const button = makeButton( container.ownerDocument, async () => {
		const sRGBHex = await openEyedropper();
		if ( ! sRGBHex ) {
			return;
		}
		// Resolve onChange at pick time so tab switches don't leave us
		// holding a stale fiber.
		const onChange = findPaletteOnChange( container );
		if ( onChange ) {
			onChange( sRGBHex );
		}
	} );

	container.appendChild( button );
}

/* ------------------------------------------------------------------ *
 * Custom ColorPicker (incl. gradient control points)
 * ------------------------------------------------------------------ */

function setReactInputValue( input, value ) {
	const setter = Object.getOwnPropertyDescriptor(
		window.HTMLInputElement.prototype,
		'value'
	).set;
	setter.call( input, value );
	input.dispatchEvent( new Event( 'input', { bubbles: true } ) );
}

async function pickAndApplyHex( picker ) {
	const sRGBHex = await openEyedropper();
	if ( ! sRGBHex ) {
		return;
	}

	// The hex text input only exists in Hex mode; switch the format
	// select over first if the user had RGB/HSL open.
	const formatSelect = picker.querySelector( 'select' );
	if ( formatSelect && formatSelect.value !== 'hex' ) {
		const selectSetter = Object.getOwnPropertyDescriptor(
			window.HTMLSelectElement.prototype,
			'value'
		).set;
		selectSetter.call( formatSelect, 'hex' );
		formatSelect.dispatchEvent( new Event( 'change', { bubbles: true } ) );
		await new Promise( ( resolve ) => setTimeout( resolve, 50 ) );
	}

	// The hex field renders without a type attribute; match it by its
	// 9-char limit (#RRGGBBAA) with a class fallback.
	const hexInput =
		picker.querySelector( 'input[maxlength="9"]' ) ||
		picker.querySelector( '.components-input-control__input' );
	if ( hexInput ) {
		setReactInputValue( hexInput, sRGBHex.replace( /^#/, '' ) );
	}
}

function injectPickerButton( picker ) {
	if ( picker.querySelector( `.${ BUTTON_CLASS }` ) ) {
		return;
	}

	const button = makeButton(
		picker.ownerDocument,
		() => pickAndApplyHex( picker ),
		'is-in-picker'
	);

	picker.appendChild( button );
}

/* ------------------------------------------------------------------ */

domReady( () => {
	if ( typeof window.EyeDropper === 'undefined' ) {
		return;
	}

	const observer = new MutationObserver( () => {
		document
			.querySelectorAll( PALETTE_SELECTORS )
			.forEach( injectPaletteButton );
		document
			.querySelectorAll( '.components-color-picker' )
			.forEach( injectPickerButton );
	} );

	observer.observe( document.body, { childList: true, subtree: true } );
} );
