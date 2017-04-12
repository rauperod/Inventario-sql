/**
 * Created by Raul Perez on 11/04/2017.
 */
'use strict'

const UserModel = require('../models/user'),
      SucursalModel = require('../models/sucursal')

function usersGet(req, res) {
    let usuario = req.session.user
    // verifica que tipo de usuario es
    if( usuario.permisos === 2 ){  // si es admin general
        let seleccion = ['*'] // pongo la seleccion que hara
        UserModel.getUsers( seleccion ,usuarios => { // si se pudieron obtener los usuarios
            res.render('./users/manager', { usuarios, usuario } )
        }, error => { // si hubo un error
            console.log(`Error al obtener los usuarios: ${error}`)
            res.redirect('/almacen')
        })
    } else { // si es admin de sucursal
        let idSucursal = req.session.user.idSucursal, // obtienes el id de la sucursal del usuario
              seleccion = ['username','password','nombre','apellido','permisos','status'] // pongo la seleccion que hara
        UserModel.getUsersBySucursal(idSucursal, seleccion ,usuarios => { // si se pudieron obtener los usuarios
            res.render('./users/manager', { usuarios, usuario } )
        }, error => { // si hubo un error
            console.log(`Error al obtener los usuarios: ${error}`)
            res.redirect('/almacen')
        })
    }
}

function usersNewGet(req, res) {
    let usuario = req.session.user
    if( usuario.permisos === 2 ){ // si es admin general
        let seleccion = ['plaza']
        SucursalModel.getSucursales(seleccion, sucursales => { // si se pudo obtener las sucursales
            res.render('./users/new', { sucursales, usuario })
        }, error => { // si ocurrio un error
            console.log(`Error no se pudieron obtener las sucursales: ${error}`)
        })
    } else { // si es admin general
        res.render('./users/new',{ usuario })
    }
}

function usersNewPost(req, res) {
    const usuario = req.session.user
    if( usuario.permisos === 2 ){ // si es administrador general
        // declaro constantes necesarias
        let plaza = req.body.plaza,
            seleccion = ['idSucursal']
        // busco la sucursal del nuevo usuario
        SucursalModel.getSucursalByPlaza(plaza, seleccion, sucursal => {
            // genero el nuevo usuario
            let nuevoUsuario = {
                username: req.body.username,
                nombre: req.body.name,
                apellido: req.body.last_name,
                password: req.body.password,
                sucursal: sucursal.idSucursal,
                permisos: 1
            }
            // agrego al nuevo usuario
            UserModel.createUser(nuevoUsuario, () => {  // si se agrego correctamente
                res.redirect('/almacen', { usuario })
            }, error => { // si hubo error
                console.log(`Error al agregar en nuevo usuario: ${error}`)
                // mando una alerta que el username esta repetido
                res.send('0')
            })
        }, error => {
            console.log(`Error al obtener la sucural: ${error}`)
            res.redirect('/almacen')
        })
    } else { // si es administrador de sucursales
        // genero el nuevo usuario
        let nuevoUsuario = {
            username: req.body.username,
            nombre: req.body.name,
            apellido: req.body.last_name,
            password: req.body.password,
            sucursal: usuario.idSucursal,
            permisos: 0
        }
        // agrego al nuevo usuario
        UserModel.createUser(nuevoUsuario, () => {  // si se agrego correctamente
            res.redirect('/almacen', { usuario })
        }, error => { // si hubo error
            console.log(`Error al agregar en nuevo usuario: ${error}`)
            // mando una alerta que el username esta repetido
            res.send('0')
        })
    }
}

function usersIdUsuarioGet() {
    
}

function usersIdUsuarioPut() {

}

module.exports = {
    usersGet,
    usersNewGet,
    usersNewPost,
    usersIdUsuarioGet,
    usersIdUsuarioPut
}