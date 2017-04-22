/**
 * Created by Raul Perez on 21/04/2017.
 */
'use strict'

const ProductModel = require('../models/producto'),
      CategoryModel = require('../models/categoria'),
      Utilidad = require('../ayuda/utilidad'),
      fs = require('fs'),
      xlstojson = require("xls-to-json-lc"),
      xlsxtojson = require("xlsx-to-json-lc"),
      excel = require('./excel')

function productsGet(req, res) {
    // buscas todos los productos
    ProductModel.getProducts( productos => { // si no hubo error
        res.render('./products/manager', { productos, usuario: req.session.user })
    }, error => { // si ocurrio un error
        console.log(`Error al obtener los productos: ${error}`)
        res.json({ msg: `Error al obtener los productos: ${error}`, tipo: 0})
    })
}

function productsNewGet(req, res) {
    // busca el nombre de las categorias
    CategoryModel.getNamesOfCategories( categorias => { // si no hubo error
        res.render("./products/new",{ usuario: req.session.user, categorias })
    }, error => { // si hubo error
        console.log(`Error al obtener las categorias: ${error}`)
        res.json({ msg: `Error al obtener las categorias: ${error}`, tipo: 0})
    })
}

function productsNewPost(req, res) {
    // variables necesarias
    let nombreCategoria = req.body.categoria,
        promesa = new Promise((resolve, reject) => {
            // busca la categoria elegida
            CategoryModel.getIdCategoryByName(nombreCategoria, idCategoria => {
                return resolve(idCategoria)
            }, error => { // si hubo error
                return reject({ msg: `Error al buscar el id de la categoria: ${error}`, tipo: 0})
            })
        })

    promesa
            .then( idCategoria => {
                // crea el nuevo producto
                let nuevoProducto = {
                    nombre: req.body.nombre,
                    descripcion: req.body.descripcion,
                    codigo: req.body.codigo,
                    minimo: req.body.minimo,
                    esbasico: req.body.basico === 'Si',
                    idCategoria
                }
                // guarda el nuevo producto en la base de datos
                ProductModel.createProduct(nuevoProducto, () => { // si no hubo error al guardarlo
                    res.redirect('/products')
                }, error => { // si hubo un error
                    // manda una alerta que se repite el nombre o codigo
                    return reject({ msg: `Error al guardar el nuevo producto: ${error}`, tipo: 1})
                })
            })
            .catch( error => {
                res.json(error)
            })
}

function productsIdProductoGet(req, res) {
    // declaro variables necesarias
    let usuario = req.session.user,
        idProducto = req.params.idProducto
    // busca el nombre de las categorias
    CategoryModel.getNamesOfCategories( categorias => { // si no hubo error
        // busco el producto a editar
        ProductModel.getProductById(idProducto, productoUpdate => { // si no hubo error
            res.render("./products/update",{ usuario, categorias, productoUpdate })
        }, error => { // si hubo error
            console.log(`Error al obtener el producto: ${error}`)
            res.json({ msg: `Error al obtener el producto: ${error}`, tipo: 0})
        })
    }, error => { // si hubo error
        console.log(`Error al obtener las categorias: ${error}`)
        res.json({ msg: `Error al obtener las categorias: ${error}`, tipo: 0})
    })
}

function productsIdProductoPut(req, res) {
    // variables necesarias
    let nombreCategoria = req.body.categoria,
        idProducto = req.params.idProducto
    // busca la categoria elegida
    CategoryModel.getIdCategoryByName(nombreCategoria, idCategoria => { // si no hubo error
        // crea el producto ya editado
        let productoUpdate = {
            idProducto,
            nombre: req.body.nombre,
            descripcion: req.body.descripcion,
            codigo: req.body.codigo,
            minimo: req.body.minimo,
            esbasico: req.body.basico === 'Si',
            idCategoria
        }
        // guarda el nuevo producto en la base de datos
        ProductModel.updateProduct(productoUpdate, () => { // si no hubo error al guardarlo
            res.redirect('/products')
        }, error => { // si hubo un error
            console.log(`Error al editar el producto: ${error}`)
            // manda una alerta que se repite el nombre o codigo
            res.json({ msg: `Error al editar el producto: ${error}`, tipo: 1})
        })

    }, error => { // si hubo error
        console.log(`Error al buscar el id de la categoria: ${error}`)
        res.json({ msg: `Error al buscar el id de la categoria: ${error}`, tipo: 0})
    })
}

function productsIdProductoDelete(req, res) {

}

function excelGet(req, res) {
    res.render("./products/excel",{ usuario: req.session.user })
}

function excelPost(req, res) {
    let exceltojson

    excel.upload(req, res, err => {
        if(err){
            console.log(err)
            res.json({ msg: `error inesperado: ${err}`, tipo: 1})
            return
        }
        if(!req.file){
            console.log("No hay archivo")
            res.json({ msg: `error inesperado: ${err}`, tipo: 1})
            return
        }
        // verifico la extencion del excel
        if(req.file.originalname.split('.')[req.file.originalname.split('.').length-1] === 'xlsx'){
            exceltojson = xlsxtojson;
        }else{
            exceltojson = xlstojson;
        }

        exceltojson({ input: req.file.path,  output: null, lowerCaseHeaders :true }, (err, productos) => {
            if( !err ){ // si no hubo error
                for (let producto of productos) {
                    // variables necesarias
                    let nombreCategoria = producto.categoria
                    // busca la categoria elegida
                    CategoryModel.getIdCategoryByName(nombreCategoria, idCategoria => { // si no hubo error
                        // crea el nuevo producto
                        let nuevoProducto = {
                            nombre: producto.nombre,
                            descripcion: producto.descripcion,
                            codigo: producto.codigo,
                            minimo: producto.minimo,
                            esbasico: producto.basico.toLowerCase() === 'si',
                            idCategoria
                        }
                        // guarda el nuevo producto en la base de datos
                        ProductModel.createProduct(nuevoProducto, () => { // si no hubo error al guardarlo
                            // se agrego correctametne y continua agregando productos
                        }, error => { // si hubo un error
                            // e  = {msg: `Error al guardar el nuevo producto: ${error}`, tipo: 2}
                        })

                    }, error => { // si hubo error
                        // {msg: `Error al buscar el id de la categoria: ${error}`, tipo: 0}
                    })
                }
                res.json({ msg: 'Productos agregados correctamente', tipo: 3})

            }else{ // hubo un erro
                console.log(err)
                res.json({ msg: err, tipo: 1})
            }
        })
    })
}

module.exports = {
    productsGet,
    productsNewGet,
    productsNewPost,
    productsIdProductoGet,
    productsIdProductoPut,
    productsIdProductoDelete,
    excelGet,
    excelPost
}