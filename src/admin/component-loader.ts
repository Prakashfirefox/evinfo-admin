import { ComponentLoader } from 'adminjs';

const componentLoader = new ComponentLoader();

// Register custom components used by admin resource configs
// Paths are relative to this file and will be bundled by AdminJS/webpack during startup
componentLoader.add('CustomS3Upload', './components/CustomS3Upload');
componentLoader.add('CustomTextEditor', './components/CustomTextEditor');
componentLoader.add('BlogSectionsEdit', './components/BlogSectionsEdit');
componentLoader.add('BlogSectionsShow', './components/BlogSectionsShow');
componentLoader.add('BlogSectionsList', './components/BlogSectionsList');


export default componentLoader;
