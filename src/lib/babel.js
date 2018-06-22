import babel from 'babel-standalone'

export const CHECK_FN_NAME = '__CHECK_INPUT'

const babelPlugin = ({ types: t }) => {
  const createStatement = () => t.awaitExpression(t.callExpression(t.identifier(CHECK_FN_NAME), []))

  return {
    visitor: {
      FunctionDeclaration(path, state) {
        const fnName = path.node.id.name
        path.node.async = true
        
        // console.log(fnName, path)
        path.parentPath.traverse({
          CallExpression(path, state) {
            if (t.isIdentifier(path.node.callee, { name: fnName }) && path.parent.type !== 'AwaitExpression') {
              // console.log(fnName, path)
              path.replaceWith(
                t.awaitExpression(path.node)
              )
            }
          }
        })
      },
      ExpressionStatement(path, state) {
        // AssignmentExpression
        // console.log(path.node)
        path.insertAfter(createStatement())
      },
      DoWhileStatement(path, state) {
        path.get('body').pushContainer('body', createStatement())
      },
      WhileStatement(path, state) {
        path.get('body').pushContainer('body', createStatement())
      },
      ForStatement(path, state) {
        // console.log('createStatement', createStatement())
        path.get('body').pushContainer('body', createStatement())
      }
    }
  }
}

export const transformCode = code => {
  const extendedCode = babel.transform(`async function sort(input, ${CHECK_FN_NAME}) {\n${code.split('\n').map(line => `  ${line}`).join('\n')}\n}`, {plugins: [babelPlugin]}).code
  return babel.transform(extendedCode, {presets: ['es2015']}).code
}
