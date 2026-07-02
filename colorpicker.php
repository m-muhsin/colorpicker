<?php
/**
 * Plugin Name:       Color Picker
 * Description:       Adds a Color Picker sidebar to the block editor for picking, copying, and applying colors to blocks.
 * Version:           1.0.0
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

/**
 * Enqueue the editor script and styles for the Color Picker sidebar.
 */
function colorpicker_enqueue_editor_assets() {
	$asset_file = plugin_dir_path( __FILE__ ) . 'build/index.asset.php';

	if ( ! file_exists( $asset_file ) ) {
		return;
	}

	$asset = include $asset_file;

	wp_enqueue_script(
		'colorpicker-editor',
		plugins_url( 'build/index.js', __FILE__ ),
		$asset['dependencies'],
		$asset['version'],
		true
	);

	if ( file_exists( plugin_dir_path( __FILE__ ) . 'build/style-index.css' ) ) {
		wp_enqueue_style(
			'colorpicker-editor',
			plugins_url( 'build/style-index.css', __FILE__ ),
			array( 'wp-components' ),
			$asset['version']
		);
	}
}
add_action( 'enqueue_block_editor_assets', 'colorpicker_enqueue_editor_assets' );
