import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

export function ngAdd(_options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Update styles in angular.json
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

    // Generate Tailwind config files
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

    // Update styles.css with Tailwind directives
    const stylesPath = '/src/styles.css';
    const stylesContent = `
@tailwind base;
@tailwind components;
@tailwind utilities;
`;
    if (tree.exists(stylesPath)) {
      const existingStyles = tree.read(stylesPath)!.toString('utf-8');
      tree.overwrite(stylesPath, existingStyles + '\n' + stylesContent);
    } else {
      tree.create(stylesPath, stylesContent);
    }

    // Add Tailwind dependencies
    context.addTask(
      new NodePackageInstallTask({
        packageName: 'tailwindcss postcss autoprefixer',
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
        'export class AppComponent',
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

// function configureTailwind(): Rule {
//   return (tree: Tree, context: SchematicContext) => {
//     context.logger.info('Configuring Tailwind CSS...');

//     // Update angular.json
//     const angularJsonPath = 'angular.json';
//     if (tree.exists(angularJsonPath)) {
//       const angularJson = JSON.parse(tree.read(angularJsonPath)!.toString());
//       const projectName = Object.keys(angularJson.projects)[0];
//       const stylesArray =
//         angularJson.projects[projectName]?.architect?.build?.options?.styles ||
//         [];

//       if (!stylesArray.includes('src/styles.css')) {
//         stylesArray.push('src/styles.css');
//       }
//       angularJson.projects[projectName].architect.build.options.styles =
//         stylesArray;
//       tree.overwrite(angularJsonPath, JSON.stringify(angularJson, null, 2));
//     }

//     // Create Tailwind config files
//     if (!tree.exists('tailwind.config.js')) {
//       tree.create(
//         'tailwind.config.js',
//         `module.exports = {
//   darkMode: 'class',
//   content: ['./src/**/*.{html,ts}'],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// };`
//       );
//     }

//     if (!tree.exists('postcss.config.js')) {
//       tree.create(
//         'postcss.config.js',
//         `module.exports = {
//   plugins: {
//     tailwindcss: {},
//     autoprefixer: {},
//   },
// };`
//       );
//     }

//     // Add Tailwind directives to styles.css
//     const stylesPath = '/src/styles.css';
//     const stylesContent = `
// @tailwind base;
// @tailwind components;
// @tailwind utilities;
// `;
//     if (tree.exists(stylesPath)) {
//       const existingStyles = tree.read(stylesPath)!.toString('utf-8');
//       tree.overwrite(stylesPath, existingStyles + '\n' + stylesContent);
//     } else {
//       tree.create(stylesPath, stylesContent);
//     }

//     // Add Tailwind dependencies
//     context.addTask(
//       new NodePackageInstallTask({
//         packageName: 'tailwindcss postcss autoprefixer',
//       })
//     );

//     return tree;
//   };
// }
