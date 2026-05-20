import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface IUser {
  id?: number;
  email: string;
  password: string;
  name: string;
  createdAt?: Date;
}

class User extends Model<IUser> implements IUser {
  public id!: number;
  public email!: string;
  public password!: string;
  public name!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        fields: ['email'],
      },
    ],
  }
);

export default User;
