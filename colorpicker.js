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
( function ( wp ) {
	'use strict';

	var __ = wp.i18n.__;

	var BUTTON_CLASS = 'colorpicker-core-eyedropper';

	var PALETTE_SELECTORS =
		'.block-editor-color-gradient-control__panel, .components-color-palette';

	function openEyedropper() {
		return new window.EyeDropper()
			.open()
			.then(
				function ( result ) {
					return result.sRGBHex;
				},
				function () {
					return null; // User dismissed the eyedropper.
				}
			)
			.then( function ( sRGBHex ) {
				// Defer past the promise-resolution microtask. On
				// Windows, Chrome tears down the native eyedropper
				// overlay as the promise resolves; triggering React
				// updates during that teardown has frozen the window.
				// 100ms gives the overlay time to fully close.
				return new Promise( function ( resolve ) {
					setTimeout( function () {
						resolve( sRGBHex );
					}, 100 );
				} );
			} );
	}

	function makeButton( doc, onClick, extraClass ) {
		var button = doc.createElement( 'button' );
		button.type = 'button';
		button.className =
			'components-button is-secondary is-compact ' +
			BUTTON_CLASS +
			( extraClass ? ' ' + extraClass : '' );
		button.textContent = __( 'Pick from screen', 'colorpicker' );
		button.addEventListener( 'click', onClick );
		return button;
	}

	/* -------------------------------------------------------------- *
	 * Palette popovers
	 * -------------------------------------------------------------- */

	/**
	 * Walk up the React fiber tree from the swatch picker to find the
	 * ColorPalette component's onChange prop. Returns null on the
	 * Gradient tab (its picker has no `colors` prop up the chain).
	 */
	function findPaletteOnChange( container ) {
		var anchor =
			container.querySelector( '.components-circular-option-picker' ) ||
			container;
		var fiberKey = Object.keys( anchor ).find( function ( key ) {
			return key.indexOf( '__reactFiber$' ) === 0;
		} );
		var fiber = anchor[ fiberKey ];
		while ( fiber ) {
			var props = fiber.memoizedProps;
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
		if ( container.querySelector( '.' + BUTTON_CLASS ) ) {
			return;
		}
		// Skip when no color palette is mounted here (e.g. Gradient tab).
		if ( ! findPaletteOnChange( container ) ) {
			return;
		}

		var button = makeButton( container.ownerDocument, function () {
			openEyedropper().then( function ( sRGBHex ) {
				// Bail if the popover was dismissed while the
				// eyedropper was open (the native overlay steals
				// window focus on Windows, which can close it).
				if ( ! sRGBHex || ! container.isConnected ) {
					return;
				}
				// Resolve onChange at pick time so tab switches don't
				// leave us holding a stale fiber.
				var onChange = findPaletteOnChange( container );
				if ( onChange ) {
					onChange( sRGBHex );
				}
			} );
		} );

		container.appendChild( button );
	}

	/* -------------------------------------------------------------- *
	 * Custom ColorPicker (incl. gradient control points)
	 * -------------------------------------------------------------- */

	function setReactInputValue( input, value ) {
		var setter = Object.getOwnPropertyDescriptor(
			window.HTMLInputElement.prototype,
			'value'
		).set;
		setter.call( input, value );
		input.dispatchEvent( new Event( 'input', { bubbles: true } ) );
	}

	function applyHexToPicker( picker, sRGBHex ) {
		// The hex field renders without a type attribute; match it by
		// its 9-char limit (#RRGGBBAA) with a class fallback.
		var hexInput =
			picker.querySelector( 'input[maxlength="9"]' ) ||
			picker.querySelector( '.components-input-control__input' );
		if ( hexInput ) {
			setReactInputValue( hexInput, sRGBHex.replace( /^#/, '' ) );
		}
	}

	function pickAndApplyHex( picker ) {
		openEyedropper().then( function ( sRGBHex ) {
			// Bail if the picker was dismissed while the eyedropper
			// was open (the native overlay steals window focus on
			// Windows, which can close it).
			if ( ! sRGBHex || ! picker.isConnected ) {
				return;
			}

			// The hex text input only exists in Hex mode; switch the
			// format select over first if the user had RGB/HSL open.
			var formatSelect = picker.querySelector( 'select' );
			if ( formatSelect && formatSelect.value !== 'hex' ) {
				var selectSetter = Object.getOwnPropertyDescriptor(
					window.HTMLSelectElement.prototype,
					'value'
				).set;
				selectSetter.call( formatSelect, 'hex' );
				formatSelect.dispatchEvent(
					new Event( 'change', { bubbles: true } )
				);
				setTimeout( function () {
					applyHexToPicker( picker, sRGBHex );
				}, 50 );
				return;
			}

			applyHexToPicker( picker, sRGBHex );
		} );
	}

	function injectPickerButton( picker ) {
		if ( picker.querySelector( '.' + BUTTON_CLASS ) ) {
			return;
		}

		var button = makeButton(
			picker.ownerDocument,
			function () {
				pickAndApplyHex( picker );
			},
			'is-in-picker'
		);

		picker.appendChild( button );
	}

	/* -------------------------------------------------------------- */

	wp.domReady( function () {
		if ( typeof window.EyeDropper === 'undefined' ) {
			return;
		}

		var observer = new MutationObserver( function () {
			// Never let an exception escape the observer callback: an
			// error thrown while React is mid-render could otherwise
			// cascade into repeated mutation/error cycles.
			try {
				document
					.querySelectorAll( PALETTE_SELECTORS )
					.forEach( injectPaletteButton );
				document
					.querySelectorAll( '.components-color-picker' )
					.forEach( injectPickerButton );
			} catch ( error ) {
				// Swallow; the next mutation batch will retry.
			}
		} );

		observer.observe( document.body, { childList: true, subtree: true } );
	} );
} )( window.wp );
