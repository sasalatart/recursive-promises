# Promesas
### Uso de promesas recursivas para leer la estructura de un directorio

> Patricio López ([@mrpatiwi](https://github.com/mrpatiwi)) y Sebastián Salata ([@sasalatart](https://github.com/sasalatart))

##### Usage

 1. Run `npm install`.
 2. Place your directory inside the `test` directory ([here](test)).
 3. Read it by running `npm start`.

##### ¿Qué son?
Representan operaciones que no han terminado aún, pero que eventualmente lo
harán (y de paso retornarán *algo*). Este *algo* puede ser la notificación de un
error, o el output de la operación.

Sus estados pueden ser:
 * *Pending*: no están listas aún.
 * *Fulfilled*: terminaron con su ejecución.
 * *Rejected*: hubo un error.

##### ¿Por qué usarlas?
Nos permiten ejecutar operaciones asíncronas de manera secuencial. Además,
muchas veces abusamos de los *callbacks*, y terminamos anidando un *callback*
dentro de otro ('*callback hell*') lo que hace poco legible nuestro código.
Sin embargo, mediante promesas podemos evitar esto.

##### ¿Qué hicimos? Análisis del algoritmo por partes.
Para leer un directorio (sólo el "piso actual") usamos la función
`readdirPromise`:

```javascript
function readdirPromise(path) {
  return new Promise(function(resolve, reject) {
    fs.readdir(path, function(err, paths) {
      err ? reject(err) : resolve(paths);
    });
  });
}
```

A ella le ingresamos el *path* que deseamos leer, y retorna una nueva promesa.
Si esta promesa entra al estado *fulfilled*, retorna un arreglo con los nombres
de los archivos y carpetas que componen al directorio. En cambio, si entra al
estado *rejected*, retorna el error.

Para ver si un elemento es un archivo o un directorio, usamos la función
`isDirectory(path)`, la cual toma una path y retorna `true` si es una carpeta, y
`false` si no lo es:

```javascript
function isDirectory(path) {
  return fs.lstatSync(path).isDirectory();
}
```

En caso de llegar a un archivo, usamos la función `readFilePromise(path)`, la
cual retorna una promesa en estado *fulfilled* con su nombre:

```javascript
function readFilePromise(path) {
  return new Promise.resolve(path);
}
```

Nuestra recursión, y por ende nuestra función principal, consiste en:

 1. Leemos el directorio actual.
 2. Si no hay error (`.then`), mediante `map` a cada elemento del directorio
    leído le hacemos:
  * otra recursión si es una carpeta, o
  * retornamos su nombre si no es una carpeta.
 3. Si hay error (`.catch`), lo escribimos en consola y lo propagamos a través
    de la recursión.

Así, el código para esta recursión es el siguiente:

```javascript
function explore(dir) {
  return readdirPromise(dir)
  .then(function(paths) {
    return Promise.all(paths.map(function(path) {
      path = pathResolve(dir, path);
      return isDirectory(path) ? explore(path) : readFilePromise(path);
    }));
  })
  .catch(function(err) {
    console.log(err);
    throw err;
  });
}
```

Es importante destacar la función `Promise.all`, la cual retorna un arreglo de
promesas. En nuestro caso estos arreglos representan un directorio. Así, si hay
un arreglo dentro de otro es porque habían carpetas dentro del directorio.
Por otra parte, utilizamos la función `pathResolve(dir, path)` para hacer el
programa más portable, ya que en UNIX se usan los "/" para separar los
directorios, mientras que en Windows, por ejemplo, se usan los "\".

Finalmente, si llamamos `test` al directorio a explorar, y lo colocamos en el
mismo directorio donde está ubicado el programa, la ejecución del algoritmo
completo se reduce a:

```javascript
explore(pathResolve('.', 'test'))
.then(function(results) {
  console.log(results);
})
.catch(function(err) {
  console.log('Fail');
});
```

De esta manera se imprime el arreglo que contiene la estructura del directorio
en caso de no haber errores (`.then`), o el stack de errores en caso de haberlos
(`.catch`).

##### Procesar resultado

Vamos a declarar una función que nos permite hacer un `flat` recursivo.

```javascript
function flatten(arr) {
  return arr.reduce(function(flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}
```

También una función para imprimir de manera legible los resultados.
```javascript
function printArray(arr) {
  console.log(JSON.stringify(arr, null, 4));
}
```

##### Librerías utilizadas
 * **fs**: para leer directorios y archivos.
 * **path.resolve**: para hacer el código más portable (diferencias entre '/' y
   '\' en distintos sistemas operativos).
 * **bluebird**: proporciona los métodos `Promise.resolve` y `Promise.all`.
