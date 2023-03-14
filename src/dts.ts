import {
  type CallExpression,
  type ExportAssignment,
  type NodeArray,
  type Statement,
} from 'typescript';

import { tryImport } from './utils';

export async function generateDTS(filePath: string): Promise<string | null> {
  const tsImport = await tryImport(() => import('typescript'));

  if (!tsImport?.createProgram) {
    return null;
  }

  const ts = tsImport;

  function findDefaultExport(
    statements: NodeArray<Statement>,
  ): ExportAssignment | undefined {
    return statements.find((node): node is ExportAssignment => {
      return (
        ts.isExportAssignment(node) && !node.isExportEquals && !!node.expression
      );
    });
  }

  function getCallExpression(
    exportAssignment: ExportAssignment | undefined,
  ): CallExpression | undefined {
    const expr = exportAssignment?.expression;

    if (expr && ts.isCallExpression(expr)) {
      return expr;
    } else {
      return undefined;
    }
  }

  const program = ts.createProgram({
    rootNames: [filePath],
    options: {},
  });

  const sourceFile = program.getSourceFile(filePath);

  if (!sourceFile) {
    return null;
  }

  const checker = program.getTypeChecker();
  const defaultExport = findDefaultExport(sourceFile.statements);
  const expression = getCallExpression(defaultExport);

  if (!expression) {
    return null;
  }

  const type = checker.getTypeAtLocation(expression);
  const variablesProp = type.getProperty('variables');

  if (!variablesProp) {
    return null;
  }

  const variablesType = checker.getTypeOfSymbolAtLocation(
    variablesProp,
    expression,
  );

  const variablesProps = variablesType.getProperties();

  const variables = variablesProps.map((prop) => {
    const propName = prop.getName();
    const propType = checker.getTypeOfSymbolAtLocation(prop, expression);
    const propTypeStr = checker.typeToString(propType);

    return { name: propName, type: propTypeStr };
  });

  const functionsProp = type.getProperty('functions');

  if (!functionsProp) {
    return null;
  }

  const functionsType = checker.getTypeOfSymbolAtLocation(
    functionsProp,
    expression,
  );

  const functionsProps = functionsType.getProperties();

  const functions = functionsProps.map((prop) => {
    const propName = prop.getName();

    const propType = checker.getTypeOfSymbolAtLocation(prop, expression);
    const callSignature = propType.getCallSignatures()[0];
    const functionParams = callSignature.parameters;
    const functionReturn = checker.getReturnTypeOfSignature(callSignature);

    return {
      name: propName,
      params: functionParams.map((param) => ({
        name: param.getName(),
        type: checker.typeToString(
          checker.getTypeOfSymbolAtLocation(param, sourceFile),
        ),
      })),
      ret: checker.typeToString(functionReturn),
    };
  });

  return [
    ...variables.map(({ name, type }) => `export const ${name}:${type};`),
    '',
    ...functions.map(
      ({ name, params, ret }) =>
        `export function ${name}(${params
          .map(({ name, type }) => `${name}:${type}`)
          .join(',')}):${ret};`,
    ),
  ].join('\n');
}
