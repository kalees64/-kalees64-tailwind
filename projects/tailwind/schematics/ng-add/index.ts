import {
  Rule,
  SchematicContext,
  Tree,
  chain,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import prompt from 'inquirer'; // Correct import for ESM version of inquirer

export function ngAdd(_options: any): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    return chain([
      // updateAngular(),
      configureTailwind(),
      () => askForOptionalPackages(context), // Execute async task inside Rule
    ]);
  };
}

function configureTailwind(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.info('Configuring Tailwind CSS...');

    // Update angular.json
    const angularJsonPath = 'angular.json';
    if (tree.exists(angularJsonPath)) {
      const angularJson = JSON.parse(tree.read(angularJsonPath)!.toString());
      const projectName = Object.keys(angularJson.projects)[0];
      const stylesArray =
        angularJson.projects[projectName]?.architect?.build?.options?.styles ||
        [];

      if (!stylesArray.includes('src/styles.css')) {
        stylesArray.push('src/styles.css');
      }
      angularJson.projects[projectName].architect.build.options.styles =
        stylesArray;
      tree.overwrite(angularJsonPath, JSON.stringify(angularJson, null, 2));
    }

    // Create Tailwind config files
    if (!tree.exists('tailwind.config.js')) {
      tree.create(
        'tailwind.config.js',
        `module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {},
  },
  plugins: [],
};`
      );
    }

    if (!tree.exists('postcss.config.js')) {
      tree.create(
        'postcss.config.js',
        `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`
      );
    }

    // Add Tailwind directives to styles.css
    const stylesPath = '/src/styles.css';
    const stylesContent = `\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`;
    if (tree.exists(stylesPath)) {
      const existingStyles = tree.read(stylesPath)!.toString('utf-8');
      tree.overwrite(stylesPath, existingStyles + stylesContent);
    } else {
      tree.create(stylesPath, stylesContent);
    }

    // Add Tailwind dependencies
    context.addTask(
      new NodePackageInstallTask({
        packageName: 'tailwindcss postcss autoprefixer inquirer',
      })
    );

    // Add ThemeService

    const servicesFolderPath = '/src/app/services';
    if (!tree.exists(servicesFolderPath)) {
      tree.create(servicesFolderPath + '/.gitkeep', ''); // Ensure folder is created
    }

    const themeServicePath = `${servicesFolderPath}/theme.service.ts`;
    if (!tree.exists(themeServicePath)) {
      tree.create(
        themeServicePath,
        `import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly darkThemeClass = 'dark';

  toggleTheme(): void {
    const body = document.body;
    if (body.classList.contains(this.darkThemeClass)) {
      body.classList.remove(this.darkThemeClass);
      localStorage.setItem('theme', 'light');
    } else {
      body.classList.add(this.darkThemeClass);
      localStorage.setItem('theme', 'dark');
    }
  }

  initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add(this.darkThemeClass);
    } else {
      document.body.classList.remove(this.darkThemeClass);
    }
  }
}`
      );
    }

    // Update AppComponent
    const appComponentPath = '/src/app/app.component.ts';
    if (tree.exists(appComponentPath)) {
      const appComponentContent = tree.read(appComponentPath)!.toString();
      const updatedAppComponentContent = appComponentContent.replace(
        'export class AppComponent {',
        `import { OnInit } from '@angular/core';
import { ThemeService } from './services/theme.service';

export class AppComponent implements OnInit {
  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.initializeTheme();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }`
      );
      tree.overwrite(appComponentPath, updatedAppComponentContent);
    }

    return tree;
  };
}

async function askForOptionalPackages(
  context: SchematicContext
): Promise<Rule> {
  const answers = await prompt.prompt([
    {
      type: 'confirm',
      name: 'addToast',
      message: 'Would you like to add @kalees64/toast?',
      default: true,
    },
  ]);

  const tasks: Rule[] = [];

  if (answers.addToast) {
    context.logger.info('Adding @kalees64/toast...');
    tasks.push(addToast()); // Add @kalees64/toast task
  }

  //  {
  //     type: 'confirm',
  //     name: 'addTheme',
  //     message: 'Would you like to add @kalees64/vk-theme?',
  //     default: true,
  //   },

  // if (answers.addTheme) {
  //   context.logger.info('Adding @kalees64/vk-theme...');
  //   tasks.push(addTheme()); // Add @kalees64/vk-theme task
  // }

  // Return a rule to execute the tasks
  return (tree: Tree, context: SchematicContext) => {
    for (const task of tasks) {
      task(tree, context); // Execute each task synchronously
    }
    return tree;
  };
}

function addToast(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.info('Configuring @kalees64/toast...');

    // Add toastr styles to angular.json
    const angularJson = JSON.parse(
      tree.read('angular.json')!.toString('utf-8')
    );
    const projectName = Object.keys(angularJson.projects)[0];
    const project = angularJson.projects[projectName];

    if (
      !project.architect.build.options.styles.includes(
        'node_modules/ngx-toastr/toastr.css'
      )
    ) {
      project.architect.build.options.styles.push(
        'node_modules/ngx-toastr/toastr.css'
      );
      tree.overwrite('angular.json', JSON.stringify(angularJson, null, 2));
    }

    // Modify app.config.ts to include provideAnimations and provideToastr
    const appConfigPath = '/src/app/app.config.ts';
    const appConfigContent = tree.read(appConfigPath)?.toString('utf-8');
    if (appConfigContent) {
      const updatedConfig = appConfigContent
        .replace(
          `providers: [`,
          `providers: [\n    provideAnimations(), // required animations providers\n    provideToastr(), // Toastr providers\n`
        )
        .replace(
          `import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';`,
          `import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';\nimport { provideAnimations } from '@angular/platform-browser/animations';\nimport { provideToastr } from 'ngx-toastr';`
        );

      tree.overwrite(appConfigPath, updatedConfig);
    } else {
      context.logger.warn(
        'app.config.ts file not found. Ensure provideAnimations and provideToastr are manually added.'
      );
    }

    // Schedule npm install task
    context.addTask(
      new NodePackageInstallTask({
        packageName: 'ngx-toastr @angular/animations sweetalert2',
      })
    );

    context.logger.info('Setup complete! Run the project to use ngx-toastr.');
    return tree;
  };
}

// function addTheme(): Rule {
//   return (tree: Tree, context: SchematicContext) => {
//     const stylesPath = 'src/styles.css';
//     const cdnLink =
//       '@import url("https://kalees64.github.io/vk-cdn/vk-cdn.css");';

//     // Add the CDN link to styles.css
//     if (tree.exists(stylesPath)) {
//       const content = tree.read(stylesPath)?.toString('utf-8') || '';
//       if (!content.includes(cdnLink)) {
//         tree.overwrite(stylesPath, `${cdnLink}\n${content}`);
//       }
//     } else {
//       tree.create(stylesPath, cdnLink);
//     }

//     // Add npm packages installation task
//     // context.addTask(
//     //   new NodePackageInstallTask({
//     //     packageName:
//     //       '@fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/angular-fontawesome',
//     //   })
//     // );

//     return tree;
//   };
// }

// function updateAngular(): Rule {
//   return (tree: Tree, context: SchematicContext) => {
//     context.logger.info('Starting Angular Update...');

//     try {
//       // Run ng update command to update Angular core and CLI
//       execSync('ng update @angular/core @angular/cli', { stdio: 'inherit' });

//       // Optionally, you can also run additional update tasks, like updating dependencies.
//       execSync('ng update', { stdio: 'inherit' });

//       // Install any updated dependencies
//       context.addTask(new NodePackageInstallTask());

//       context.logger.info('Angular update completed successfully!');
//     } catch (error: unknown) {
//       if (error instanceof Error) {
//         // Now we know that 'error' is of type 'Error'
//         context.logger.error('Error updating Angular:' + error.message);
//       } else {
//         // If error is not an instance of Error, log a generic message
//         context.logger.error('Error updating Angular:' + 'Unknown error');
//       }
//       throw error;
//     }

//     return tree;
//   };
// }
