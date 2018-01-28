exports.up = function(knex, Promise) {
  return knex.schema.createTable('approval_matrix', function (t) {
    t.integer('id').primary();
    t.integer('employee_id');
    t.string('cost_center');
    t.integer('amount');
    t.timestamps();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('approval_matrix');
};
