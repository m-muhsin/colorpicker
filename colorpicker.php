<?php
/**
 * Plugin Name:       Color Picker
 * Description:       Adds a "Pick from screen" eyedropper to the block editor's color controls, for sampling any color on screen.
 * Version:           1.1.0
 * Requires at least: 6.6
 * Requires PHP:      7.2
 * Author:            Muhammad Muhsin
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       colorpicker
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'COLORPICKER_VERSION', '1.1.0' );

/**
 * Enqueue the editor script and styles for the eyedropper integration.
 */
function colorpicker_enqueue_editor_assets() {
	wp_enqueue_script(
		'colorpicker-editor',
		plugins_url( 'colorpicker.js', __FILE__ ),
		array( 'wp-dom-ready', 'wp-i18n' ),
		COLORPICKER_VERSION,
		true
	);

	wp_enqueue_style(
		'colorpicker-editor',
		plugins_url( 'colorpicker.css', __FILE__ ),
		array( 'wp-components' ),
		COLORPICKER_VERSION
	);
}
add_action( 'enqueue_block_editor_assets', 'colorpicker_enqueue_editor_assets' );
