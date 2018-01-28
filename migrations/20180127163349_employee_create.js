exports.up = function(knex, Promise) {
  return knex.schema.createTable('employees', function (t) {
    t.integer('id').primary();
    t.integer('employee_id');
    t.string('email');
    t.string('password');
    t.string('name');
    t.integer('manager_id');
    t.boolean('is_admin');
    t.timestamps();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('employees');
};
