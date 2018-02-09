import py_modelica_exporter as this_package
from optparse import OptionParser
import sys
import os

from exporters import ComponentExporter, TreeExporter, PackageExporter, ParsingException, ComponentAssemblyExporter, LayoutExporter

import logging
import timeit

# create logger with 'spam_application'
logger = logging.getLogger('py_modelica_exporter')
logger.setLevel(logging.DEBUG)

# create file handler which logs even debug messages
if not os.path.isdir('log'):
    os.mkdir('log')

fh = logging.FileHandler(os.path.join('log', 'py_modelica_exporter.log'))
fh.setLevel(logging.DEBUG)

# create console handler with a higher log level
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)

# create formatter and add it to the handlers
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)
ch.setFormatter(formatter)

# add the handlers to the logger
logger.addHandler(fh)
logger.addHandler(ch)


# get class name to export
def main():
    parser = OptionParser()
    parser.add_option("-v", "--version", action="store_true", default=False,
                      help='Displays the version number of this package.')
    parser.add_option("-c", "--components", action="store", type="string",
                      help='A semicolon-separated list of components to export.')
    parser.add_option("-j", "--json", action="store_true", default=False,
                      help='Exports the component in json format.')
    parser.add_option("-t", "--tree", action="store", type="string",
                      help='Export tree starting from this component')
    parser.add_option("-p", "--packages", type="string", action="store",
                      help='Load semicolon-separated list of external package.mo paths')
    parser.add_option("-f", "--config", type="string", action="store",
                      help='Load list of external packages from config file')
    parser.add_option("-x", "--xml", action="store_true", default=False,
                      help='Exports the component in xml format.')
    parser.add_option("-a", "--assemblies", action="store", type="string",
                      help='A semicolon-separated list of component-assemblies to export.')
    parser.add_option("-s", "--standard", action="store_true", default=False,
                      help='List the models from the MSL')
    parser.add_option("-i", "--icons", action="store_true", default=False,
                      help='Export an icon.svg based on each model annotation.')
    parser.add_option("-l", "--location", action="store", type="string",
                      help='Export location/layout information from the annotation.')

    (opts, args) = parser.parse_args()

    if opts.version:
        print this_package.__version__
    elif opts.components:
        if opts.packages:
            external_packages = [p for p in opts.packages.split(';') if p]
        else:
            external_packages = []

        if opts.icons:
            component_exporter = ComponentExporter(external_packages, export_icons=True)
        else:
            component_exporter = ComponentExporter(external_packages, export_icons=False)

        components_to_export = [c for c in opts.components.split(';') if c]
        logger.info('Exporting components {0}'.format(components_to_export))
        extracted_components = []
        for modelica_uri in components_to_export:
            if opts.json:
                start_time = timeit.default_timer()
                extracted_components.append(component_exporter.get_component_json(modelica_uri))
                stop_time = timeit.default_timer()

                total_time = stop_time - start_time
                logger.info('Extracted info for {0} - {1} seconds'.format(modelica_uri, total_time))

        if opts.json:
            import json
            with open('modelica_components.json', 'w') as f_out:
                json.dump(extracted_components, f_out)

    elif opts.tree:
        treeToExport = opts.tree

        treeExporter = TreeExporter(treeToExport)

        if opts.json:
            #treeExporter.export_to_json(treeToExport + '.tree.json')
            treeExporter.export_to_json('ModelicaPackages.tree.json')
        if opts.xml:
            treeExporter.export_to_xml(treeToExport + '.tree.xml')

    elif opts.packages:
        external_packages = [p for p in opts.packages.split(';') if p]

        package_exporter = PackageExporter(external_packages, load_MSL=opts.standard)

        if opts.json:
            package_exporter.packageNames.sort()
            package_exporter.exportToJson('ModelicaPackages.tree.json')
            #package_exporter.exportToJson("_".join(package_exporter.externalPackageNames) + '.tree.json')

    elif opts.config:
        externalPackageFile = opts.config
        logger.info('loading packages from "{0}" ... '.format(externalPackageFile))

        package_exporter = PackageExporter(externalPackageFile, load_MSL=opts.standard)

        if opts.json:
            package_exporter.packageNames.sort()
            package_exporter.exportToJson("_".join(package_exporter.packageNames) + '.tree.json')

    elif opts.assemblies:

        if opts.packages:
            external_packages = [p for p in opts.packages.split(';') if p]
        else:
            external_packages = []

        assembly_uris = [c.strip() for c in opts.assemblies.split(';') if c]
        extracted_assemblies = []

        component_assembly_exporter = ComponentAssemblyExporter(external_packages)
        for modelica_uri in assembly_uris:
            extracted_assemblies.append(component_assembly_exporter.get_component_assembly_json(modelica_uri))

        if opts.json:
            import json
            with open('component_assemblies.json', 'w') as f_out:
                json.dump(extracted_assemblies, f_out)

    elif opts.location:
        if opts.packages:
            external_packages = [p for p in opts.packages.split(';') if p]
        else:
            external_packages = []

        layout_exporter = LayoutExporter(external_packages)

        modelica_classes = [c for c in opts.location.split(';') if c]

        for m_class in modelica_classes:

            #layout_exporter.test_omc_get_components(m_class)

            assembly_info = layout_exporter.extract_assembly_layout(m_class)

            layout_exporter.scale_layout_for_webgme(assembly_info)

            layout_json = assembly_info.layout_json()

            if opts.json:
                import json
                f_name = m_class.split('.')[-1] + '_layout.json'
                with open(f_name, 'w') as f_out:
                    json.dump(layout_json, f_out, indent=4)

    else:
        print help(this_package)

    return 0


sys.exit(main())

