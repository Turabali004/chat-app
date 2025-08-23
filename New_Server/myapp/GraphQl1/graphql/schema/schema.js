// export const schema = `
//     type Query {
//     hello: String,
//     world: String
//     }
// `

export const schema = `
    type Users {
        _id: String,
        username: String,
        email: String,
        password: String,
        status: String
    }
    type Query {
    Users: [Users]
    }
  `;
