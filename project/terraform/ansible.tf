resource "null_resource" "run_ansible_playbook" {
  provisioner "local-exec" {
    command = "ansible-playbook -v ../ansible/playbook.yml"
  }

  # Add a trigger to ensure the playbook runs when needed
  triggers = {
    always_run = "${timestamp()}"
  }

depends_on = [helm_release.nginx]

}