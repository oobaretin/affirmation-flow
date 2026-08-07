#!/usr/bin/env ruby
# frozen_string_literal: true

require 'xcodeproj'

project_path = File.expand_path('../App.xcodeproj', __dir__)
project = Xcodeproj::Project.open(project_path)

app_target = project.targets.find { |t| t.name == 'App' }
abort('App target not found') unless app_target

widget_name = 'AffirmEazeWidget'
widget_target = project.targets.find { |t| t.name == widget_name }

widget_group = project.main_group['AffirmEazeWidget'] || project.main_group.new_group('AffirmEazeWidget', 'AffirmEazeWidget')
swift_ref = widget_group.files.find { |f| f.path.to_s.end_with?('AffirmEazeWidget.swift') }
swift_ref ||= widget_group.new_file('AffirmEazeWidget.swift')
swift_ref.path = 'AffirmEazeWidget.swift'

unless widget_target
  widget_target = project.new_target(:app_extension, widget_name, :ios, '14.0')
  widget_target.add_file_references([swift_ref])
end

widget_target.build_configurations.each do |config|
  config.build_settings['INFOPLIST_FILE'] = 'AffirmEazeWidget/Info.plist'
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'AffirmEazeWidget/AffirmEazeWidget.entitlements'
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.affirmationflow.app.widget'
  config.build_settings['TARGETED_DEVICE_FAMILY'] = '1,2'
  config.build_settings['LD_RUNPATH_SEARCH_PATHS'] = '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks'
  config.build_settings['SKIP_INSTALL'] = 'YES'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'NO'
  config.build_settings['SWIFT_VERSION'] = '5.0'
  config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '14.0'
  config.build_settings['PRODUCT_NAME'] = widget_name
  config.build_settings['MARKETING_VERSION'] = '1.0'
  config.build_settings['CURRENT_PROJECT_VERSION'] = '1'
end

embed_phase = app_target.copy_files_build_phases.find { |p| p.name == 'Embed Foundation Extensions' }
unless embed_phase
  embed_phase = app_target.new_copy_files_build_phase('Embed Foundation Extensions')
  embed_phase.dst_subfolder_spec = '13'
end

already_embedded = embed_phase.files.any? { |bf| bf.display_name.to_s.include?(widget_name) }
unless already_embedded
  build_file = embed_phase.add_file_reference(widget_target.product_reference)
  build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
end

unless app_target.dependencies.any? { |d| d.target == widget_target }
  app_target.add_dependency(widget_target)
end

app_group = project.main_group['App']
plugin_ref = app_group.files.find { |f| f.path.to_s.end_with?('TodayWidgetPlugin.swift') }
plugin_ref ||= app_group.new_file('TodayWidgetPlugin.swift')
plugin_ref.path = 'TodayWidgetPlugin.swift'

unless app_target.source_build_phase.files_references.include?(plugin_ref)
  app_target.add_file_references([plugin_ref])
end

app_target.build_configurations.each do |config|
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'App/App.entitlements'
end

project.save
puts "Updated #{project_path} with #{widget_name}"
